// src/services/api.js
export const API_BASE = import.meta.env?.VITE_API_BASE || "https://marvel-rivals-reviews.onrender.com";

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

// Проверка авторизованности пользователя
export function isAuthenticated() {
  return !!localStorage.getItem("telegramUser");
}

// Получить текущего пользователя
export function getCurrentUser() {  
  const userStr = localStorage.getItem("telegramUser");
  return userStr ? JSON.parse(userStr) : null;
}

// Получить Telegram ID текущего пользователя
export function getUserId() {
  const user = getCurrentUser();
  return user?.telegramId;
}

// Проверка, имеет ли пользователь доступ к админке (через API)
export async function checkAdminAccess() {
  try {
    const userId = getUserId();
    if (!userId) return false;
    
    // This would call an endpoint on your backend that checks if the user is an admin
    // For example: GET /api/users/{userId}/admin-status
    // Since this endpoint doesn't exist yet, we'll implement a client-side check
    return isAdmin();
  } catch (error) {
    console.error("Error checking admin access:", error);
    return false;
  }
}

// Проверка, имеет ли пользователь доступ к админке (client-side)
export function isAdmin() {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Check if adminTelegramIds is defined in environment variables
  // Format: comma-separated list of Telegram IDs
  const adminIdsEnv = import.meta.env?.VITE_ADMIN_TELEGRAM_IDS;
  let adminTelegramIds = [];
  
  if (adminIdsEnv) {
    // Parse comma-separated list
    adminTelegramIds = adminIdsEnv.split(',').map(id => id.trim());
  } else {
    // Fallback to hardcoded list (replace with your actual admin Telegram IDs)
    adminTelegramIds = [
      // Add actual admin Telegram IDs here
      // Example: "123456789", "987654321"
    ];
  }
  
  return adminTelegramIds.includes(String(user.telegramId));
}

// Выход пользователя (убираем данные из локального хранилища)
export function logout() {
  localStorage.removeItem("telegramUser");
}

// =============================================================================
// API HELPER FUNCTIONS
// =============================================================================

// Добавление Telegram ID в каждый заголовок
async function apiHeaders(url, opts = {}) {
  const userId = getUserId();
  if (userId) {
    opts.headers = {
      ...opts.headers,
      "X-Mrr-User-Id": userId
    };
  }
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) {
    return null;
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// =============================================================================
// USER CONTROLLER
// =============================================================================

// Simple cache for user linked player data
const userPlayerCache = new Map();
const USER_PLAYER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/users - Получить пользователя по TelegramId
export async function getUserLinkedPlayer() {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.telegramId) throw new Error("User not authenticated");
  
  const cacheKey = currentUser.telegramId;
  
  // Check if we have valid cached data
  if (userPlayerCache.has(cacheKey)) {
    const cached = userPlayerCache.get(cacheKey);
    if (Date.now() - cached.timestamp < USER_PLAYER_CACHE_DURATION) {
      return cached.data;
    } else {
      // Remove expired cache entry
      userPlayerCache.delete(cacheKey);
    }
  }
  
  try {
    // First get user data to find linked player
    const user = await apiHeaders(`${API_BASE}/api/users`);
    // Log the user data for debugging
    console.log("User data from API:", user);
    
    // Handle the case where user might have a player field instead of playerDto
    if (user && (user.playerDto || user.player)) {
      const player = user.playerDto || user.player;
      // Process the player to extract avgGrade.parsedValue if it exists
      const processedPlayer = {
        ...player,
        avgGrade: player.avgGrade?.parsedValue ?? player.avgGrade
      };
      console.log("Processed player data:", processedPlayer);
      
      // Cache the processed player data
      userPlayerCache.set(cacheKey, {
        data: processedPlayer,
        timestamp: Date.now()
      });
      
      return processedPlayer;
    }
    return null;
  } catch (e) {
    console.error("Error fetching user linked player:", e);
    if (String(e.message).startsWith("404")) {
      return null;
    }
    throw e;
  }
}

// PATCH /api/users - Привязать игрока к пользователю
export async function linkUserToPlayer(playerId) {
  const userId = getUserId();
  if (!userId) throw new Error("User not authenticated");
  
  // Using PATCH /api/users with playerId query param
  return await apiHeaders(`${API_BASE}/api/users?playerId=${playerId}`, {
    method: "PATCH",
  });
}

export async function unlinkUserFromPlayer() {
  const userId = getUserId();
  if (!userId) throw new Error("User not authenticated");
  
  // To unlink, we would need to set playerId to null, but this isn't supported by the API
  // We'll throw an error since the API doesn't support unlinking
  throw new Error("Unlinking player not supported by API");
}

// Check if user can review a player (10-day restriction)
// This endpoint doesn't exist in the current API, so we'll skip this functionality
export async function canUserReviewPlayer(playerId) {
  // Since this endpoint doesn't exist, we'll assume the user can review
  return true;
}

// GET /api/users/all - Получить всех пользователей
// Not implemented yet

// =============================================================================
// PLAYER CONTROLLER
// =============================================================================

// Simple cache for player data to avoid duplicate requests
const playerCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// POST /api/players - Создать нового игрока
export async function createOrGetPlayerByName(nickName) {
  const body = JSON.stringify({ nickName });
  try {
    return await apiHeaders(`${API_BASE}/api/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (e) {
    if (String(e.message).startsWith("409 ")) {
      // Player already exists, fetch by nick
      return await getPlayerByNick(nickName);
    }
    throw e;
  }
}

// GET /api/players/nick/{nick} - Получить игрока
export async function getPlayerByNick(nick) {
  const cacheKey = nick.toLowerCase();
  
  // Check if we have valid cached data
  if (playerCache.has(cacheKey)) {
    const cached = playerCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    } else {
      // Remove expired cache entry
      playerCache.delete(cacheKey);
    }
  }
  
  try {
    const url = `${API_BASE}/api/players/nick/${encodeURIComponent(nick)}`;
    const player = await apiHeaders(url);
    // Process the player to extract avgGrade.parsedValue if it exists
    if (player) {
      const processedPlayer = {
        ...player,
        avgGrade: player.avgGrade?.parsedValue ?? player.avgGrade
      };
      
      // Cache the processed player data
      playerCache.set(cacheKey, {
        data: processedPlayer,
        timestamp: Date.now()
      });
      
      return processedPlayer;
    }
    return player;
  } catch (e) {
    if (String(e.message).startsWith("404")) {
      return null;
    }
    throw new Error("Player not found by nick");
  }
}

// GET /api/players/search - Поиск игрока по нику (части ника)
export async function searchPlayers(query, limit = 12) {
  if (!query) return listRecentPlayers(limit);
  const url = `${API_BASE}/api/players/search?nick=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await apiHeaders(url);
  // Handle paginated response
  const list = response && typeof response === 'object' && 'content' in response 
    ? response.content 
    : Array.isArray(response) ? response : [];
  // Process the list to extract avgGrade.parsedValue if it exists
  return list.map(player => ({
    ...player,
    avgGrade: player.avgGrade?.parsedValue ?? player.avgGrade
  }));
}

// GET /api/players - Получить всех игроков. Сортировка по "свежести" создания
export async function listRecentPlayers(limit = 12, page = 0) {
  const url = `${API_BASE}/api/players?page=${page}&limit=${limit}`;
  const response = await apiHeaders(url);
  // Handle paginated response
  if (response && typeof response === 'object' && 'content' in response) {
    // Backend pagination response format - preserve original structure and process player data
    return {
      ...response,
      content: Array.isArray(response.content) 
        ? response.content.map(player => ({
            ...player,
            avgGrade: player.avgGrade?.parsedValue ?? player.avgGrade,
            avgRank: player.avgRank?.parsedValue ?? player.avgRank
          }))
        : []
    };
  } else {
    // Fallback to previous behavior for non-paginated response
    const list = Array.isArray(response) ? response : [];
    return list.map(player => ({
      ...player,
      avgGrade: player.avgGrade?.parsedValue ?? player.avgGrade,
      avgRank: player.avgRank?.parsedValue ?? player.avgRank
    }));
  }
}

export async function listAllPlayers() {
  // Fetch all players for leaderboard
  const url = `${API_BASE}/api/players`;
  const response = await apiHeaders(url);
  // Handle paginated response
  const list = response && typeof response === 'object' && 'content' in response 
    ? response.content 
    : Array.isArray(response) ? response : [];
  // Process the list to extract avgGrade.parsedValue if it exists
  return list.map(player => ({
    ...player,
    avgGrade: player.avgGrade?.parsedValue ?? player.avgGrade
  }));
}

// PATCH /api/players/{nick} - Загрузить изображение для игрока (ignored as per request)
// Not implemented

// =============================================================================
// REVIEW CONTROLLER
// =============================================================================

// Simple cache for reviews data
const reviewsCache = new Map();
const REVIEWS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// GET /api/reviews/nick/{nick} - Получить отзывы игрока
// Updated to support pagination
export async function fetchReviewsByPlayer(playerNick, days = 30, page = 0, limit = 10) {
  const cacheKey = `${playerNick.toLowerCase()}_${days}_${page}_${limit}`;
  
  // Check if we have valid cached data
  if (reviewsCache.has(cacheKey)) {
    const cached = reviewsCache.get(cacheKey);
    if (Date.now() - cached.timestamp < REVIEWS_CACHE_DURATION) {
      return cached.data;
    } else {
      // Remove expired cache entry
      reviewsCache.delete(cacheKey);
    }
  }
  
  try {
    const url = `${API_BASE}/api/reviews/nick/${playerNick}?page=${page}&limit=${limit}`;
    const response = await apiHeaders(url);
    
    // Handle paginated response
    if (response && typeof response === 'object' && 'content' in response) {
      // Backend pagination response format
      const result = {
        items: Array.isArray(response.content) 
          ? response.content.map((review) => ({
              id: review.id,
              comment: review.review,
              createdAt: review.created,
              grade: review.grade,
              rank: review.rank,
              screenshotUrl: review.image,
              author: review.userNick?.userName || "Anonymous",
            }))
          : [],
        totalPages: response.totalPages || 0,
        currentPage: response.page || page,
        totalElements: response.totalElements || 0,
        limit: response.size || limit
      };
      
      // Cache the result
      reviewsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    } else {
      // Fallback to previous behavior for non-paginated response
      const list = Array.isArray(response) ? response : [];
      const result = {
        items: list.map((review) => ({
          id: review.id,
          comment: review.review,
          createdAt: review.created,
          grade: review.grade,
          rank: review.rank,
          screenshotUrl: review.image,
          author: review.userNick?.userName || "Anonymous",
        })),
        totalPages: 1,
        currentPage: 0,
        totalElements: list.length,
        limit: limit
      };
      
      // Cache the result
      reviewsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return result;
    }
  } catch {
    return {
      items: [],
      totalPages: 0,
      currentPage: 0,
      totalElements: 0,
      limit: limit
    };
  }
}

// GET /api/reviews/user - Получить отзывы пользователя
export async function fetchReviewsByUser(page = 0, limit = 10) {
  try {
    const userId = getUserId();
    if (!userId) return {
      items: [],
      totalPages: 0,
      currentPage: 0,
      totalElements: 0,
      limit: limit
    };
    
    const url = `${API_BASE}/api/reviews/user?page=${page}&limit=${limit}`;
    const response = await apiHeaders(url);
    
    // Handle paginated response
    if (response && typeof response === 'object' && 'content' in response) {
      // Backend pagination response format
      return {
        items: Array.isArray(response.content) 
          ? response.content.map((review) => ({
              id: review.id,
              comment: review.review,
              createdAt: review.created,
              grade: review.grade,
              rank: review.rank,
              screenshotUrl: review.image,
              playerNick: review.player?.nickName || "Unknown Player",
            }))
          : [],
        totalPages: response.totalPages || 0,
        currentPage: response.page || page,
        totalElements: response.totalElements || 0,
        limit: response.size || limit
      };
    } else {
      // Fallback to previous behavior for non-paginated response
      const list = Array.isArray(response) ? response : [];
      return {
        items: list.map((review) => ({
          id: review.id,
          comment: review.review,
          createdAt: review.created,
          grade: review.grade,
          rank: review.rank,
          screenshotUrl: review.image,
          playerNick: review.player?.nickName || "Unknown Player",
        })),
        totalPages: 1,
        currentPage: 0,
        totalElements: list.length,
        limit: limit
      };
    }
  } catch {
    return {
      items: [],
      totalPages: 0,
      currentPage: 0,
      totalElements: 0,
      limit: limit
    };
  }
}

// Fetch reviews on current user's linked player
// Updated to support pagination
export async function fetchReviewsOnLinkedPlayer(page = 0, limit = 10) {
  // We can't directly fetch reviews on a player without knowing the player ID
  // This would require first getting the user's linked player, then fetching reviews for that player
  try {
    const player = await getUserLinkedPlayer();
    if (!player) return {
      items: [],
      totalPages: 0,
      currentPage: 0,
      totalElements: 0,
      limit: limit
    };
    
    const url = `${API_BASE}/api/reviews/nick/${encodeURIComponent(player.nickName)}?page=${page}&limit=${limit}`;
    const response = await apiHeaders(url);
    
    // Handle paginated response
    if (response && typeof response === 'object' && 'content' in response) {
      // Backend pagination response format
      return {
        items: Array.isArray(response.content) 
          ? response.content.map((review) => ({
              id: review.id,
              comment: review.review,
              createdAt: review.created,
              grade: review.grade,
              rank: review.rank,
              screenshotUrl: review.image,
              author: review.userNick?.userName || "Anonymous",
            }))
          : [],
        totalPages: response.totalPages || 0,
        currentPage: response.page || page,
        totalElements: response.totalElements || 0,
        limit: response.size || limit
      };
    } else {
      // Fallback to previous behavior for non-paginated response
      const list = Array.isArray(response) ? response : [];
      return {
        items: list.map((review) => ({
          id: review.id,
          comment: review.review,
          createdAt: review.created,
          grade: review.grade,
          rank: review.rank,
          screenshotUrl: review.image,
          author: review.userNick?.userName || "Anonymous",
        })),
        totalPages: 1,
        currentPage: 0,
        totalElements: list.length,
        limit: limit
      };
    }
  } catch {
    return {
      items: [],
      totalPages: 0,
      currentPage: 0,
      totalElements: 0,
      limit: limit
    };
  }
}

// POST /api/reviews - Создать отзыв
export async function addReview(payload) {
  try {
    const res = await apiHeaders(`${API_BASE}/api/reviews`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res?.id ?? null;
  } catch (e) {
    console.error("addReview failed:", e);
    return null;
  }
}

// PATCH /api/reviews/{id} - Загрузить изображение для отзыва (ignored as per request)
// Not implemented

// =============================================================================
// ADMIN CONTROLLER
// =============================================================================

// GET /api/admin/reviews - Получить все отзывы
export async function getAllReviews() {
  try {
    const url = `${API_BASE}/api/admin/reviews`;
    const list = await apiHeaders(url);
    return Array.isArray(list)
      ? list.map((review) => ({
          id: review.id,
          comment: review.review,
          createdAt: review.created,
          grade: review.grade,
          rank: review.rank,
          screenshotUrl: review.image,
          playerNick: review.playerNick?.nickName || "Unknown Player",
          author: review.userNick?.userName || "Anonymous",
        }))
      : [];
  } catch {
    return [];
  }
}

// GET /api/admin/reviews/user/{userId} - Получить отзывы пользователя (для админов)
export async function fetchReviewsByUserId(userId, page = 0, limit = 10) {
  try {
    const url = `${API_BASE}/api/admin/reviews/user/${userId}?page=${page}&limit=${limit}`;
    const response = await apiHeaders(url);
    
    // Handle paginated response
    if (response && typeof response === 'object' && 'content' in response) {
      // Backend pagination response format
      return {
        items: Array.isArray(response.content) 
          ? response.content.map((review) => ({
              id: review.id,
              comment: review.review,
              createdAt: review.created,
              grade: review.grade,
              rank: review.rank,
              screenshotUrl: review.image,
              playerNick: review.playerNick?.nickName || "Unknown Player",
              author: review.userNick?.userName || "Anonymous",
            }))
          : [],
        totalPages: response.totalPages || 0,
        currentPage: response.page || page,
        totalElements: response.totalElements || 0,
        limit: response.size || limit
      };
    } else {
      // Fallback to previous behavior for non-paginated response
      const list = Array.isArray(response) ? response : [];
      return {
        items: list.map((review) => ({
          id: review.id,
          comment: review.review,
          createdAt: review.created,
          grade: review.grade,
          rank: review.rank,
          screenshotUrl: review.image,
          playerNick: review.playerNick?.nickName || "Unknown Player",
          author: review.userNick?.userName || "Anonymous",
        })),
        totalPages: 1,
        currentPage: 0,
        totalElements: list.length,
        limit: limit
      };
    }
  } catch {
    return {
      items: [],
      totalPages: 0,
      currentPage: 0,
      totalElements: 0,
      limit: limit
    };
  }
}

// GET /api/admin/reviews - Получить отзывы с пагинацией, поиск по нику игрока и автора
export async function getAdminReviews(playerNick, owner, page = 0, limit = 20) {
  try {
    let url = `${API_BASE}/api/admin/reviews?page=${page}&limit=${limit}`;
    
    // Add query parameters if provided
    if (playerNick) {
      url += `&nick=${encodeURIComponent(playerNick)}`;
    }
    
    if (owner) {
      url += `&owner=${encodeURIComponent(owner)}`;
    }
    
    const response = await apiHeaders(url);
    
    // Handle paginated response
    if (response && typeof response === 'object' && 'content' in response) {
      // Backend pagination response format
      return {
        items: Array.isArray(response.content) 
          ? response.content.map((review) => ({
              id: review.id,
              comment: review.review,
              createdAt: review.created,
              grade: review.grade,
              rank: review.rank,
              screenshotUrl: review.image,
              playerNick: review.player?.nickName || "Unknown Player",
              author: review.userNick?.userName || "Anonymous",
              owner: review.userNick // Include full owner object for admin actions
            }))
          : [],
        totalPages: response.totalPages || 0,
        currentPage: response.page || page,
        totalElements: response.totalElements || 0,
        limit: response.size || limit
      };
    } else {
      // Fallback to previous behavior for non-paginated response
      const list = Array.isArray(response) ? response : [];
      return {
        items: list.map((review) => ({
          id: review.id,
          comment: review.review,
          createdAt: review.created,
          grade: review.grade,
          rank: review.rank,
          screenshotUrl: review.image,
          playerNick: review.player?.nickName || "Unknown Player",
          author: review.userNick?.userName || "Anonymous",
          owner: review.userNick // Include full owner object for admin actions
        })),
        totalPages: 1,
        currentPage: 0,
        totalElements: list.length,
        limit: limit
      };
    }
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return {
      items: [],
      totalPages: 0,
      currentPage: 0,
      totalElements: 0,
      limit: limit
    };
  }
}

// DELETE /api/admin/players/{nick} - Удалить игрока
export async function deletePlayerByNick(nick) {
  try {
    return await apiHeaders(`${API_BASE}/api/admin/players/${encodeURIComponent(nick)}`, {
      method: "DELETE",
    });
  } catch (e) {
    // Handle specific error cases
    if (String(e.message).startsWith("404")) {
      throw new Error("PLAYER_NOT_FOUND");
    }
    throw e;
  }
}

// DELETE /api/admin/reviews/{id} - Удалить отзыв
export async function deleteReviewById(id) {
  try {
    return await apiHeaders(`${API_BASE}/api/admin/reviews/${id}`, {
      method: "DELETE",
    });
  } catch (e) {
    // Handle specific error cases
    if (String(e.message).startsWith("404")) {
      throw new Error("REVIEW_NOT_FOUND");
    }
    throw e;
  }
}

// PATCH /api/admin/players/{nick} - Обновить никнейм игрока, сохраня отзывы
export async function updatePlayerNick(oldNick, newNick) {
  const body = JSON.stringify({ nickName: newNick });
  try {
    return await apiHeaders(`${API_BASE}/api/admin/players/${encodeURIComponent(oldNick)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (e) {
    // Handle specific error cases
    if (String(e.message).startsWith("404")) {
      throw new Error("PLAYER_NOT_FOUND");
    } else if (String(e.message).startsWith("409")) {
      throw new Error("PLAYER_ALREADY_EXISTS");
    }
    throw e;
  }
}
