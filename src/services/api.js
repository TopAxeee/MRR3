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

// GET /api/users - Получить пользователя по TelegramId
export async function getUserLinkedPlayer() {
  try {
    // First get user data to find linked player

    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.telegramId) throw new Error("User not authenticated");
    
    const user = await apiHeaders(`${API_BASE}/api/users`);
    if (user && user.playerDto) {
      return user.playerDto;
    }
    return null;
  } catch (e) {
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
  try {
    const url = `${API_BASE}/api/players/nick/${encodeURIComponent(nick)}`;
    return await apiHeaders(url);
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
  const list = await apiHeaders(url);
  // Process the list to extract avgGrade.parsedValue if it exists
  return Array.isArray(list) ? list.map(player => ({
    ...player,
    avgGrade: player.avgGrade?.parsedValue ?? player.avgGrade
  })) : [];
}

// GET /api/players - Получить всех игроков. Сортировка по "свежести" создания
export async function listRecentPlayers(limit = 12) {
  const url = `${API_BASE}/api/players?limit=${limit}`;
  const list = await apiHeaders(url);
  // Process the list to extract avgGrade.parsedValue if it exists
  return Array.isArray(list) ? list.map(player => ({
    ...player,
    avgGrade: player.avgGrade?.parsedValue ?? player.avgGrade
  })) : [];
}

export async function listAllPlayers() {
  // Fetch all players for leaderboard
  const url = `${API_BASE}/api/players`;
  const list = await apiHeaders(url);
  // Process the list to extract avgGrade.parsedValue if it exists
  return Array.isArray(list) ? list.map(player => ({
    ...player,
    avgGrade: player.avgGrade?.parsedValue ?? player.avgGrade
  })) : [];
}

// PATCH /api/players/{nick} - Загрузить изображение для игрока (ignored as per request)
// Not implemented

// =============================================================================
// REVIEW CONTROLLER
// =============================================================================

// GET /api/reviews/nick/{nick} - Получить отзывы игрока
// Updated to support pagination
export async function fetchReviewsByPlayer(playerNick, days = 30, page = 0, limit = 10) {
  try {
    const url = `${API_BASE}/api/reviews/nick/${playerNick}?page=${page}&limit=${limit}`;
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
              author: review.owner?.userName || "Anonymous",
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
          author: review.owner?.userName || "Anonymous",
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

// GET /api/reviews/user - Получить отзывы пользователя
export async function fetchReviewsByUser() {
  try {
    const userId = getUserId();
    if (!userId) return [];
    
    const url = `${API_BASE}/api/reviews/user`;
    const list = await apiHeaders(url);
    return Array.isArray(list)
      ? list.map((review) => ({
          id: review.id,
          comment: review.review,
          createdAt: review.created,
          grade: review.grade,
          rank: review.rank,
          screenshotUrl: review.image,
          playerNick: review.player?.nickName || "Unknown Player",
        }))
      : [];
  } catch {
    return [];
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
              author: review.owner?.userName || "Anonymous",
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
          author: review.owner?.userName || "Anonymous",
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