// src/services/api.js
export const API_BASE = import.meta.env?.VITE_API_BASE || "https://marvel-rivals-reviews.onrender.com";

// Check if user is authenticated
export function isAuthenticated() {
  return !!localStorage.getItem("telegramUser");
}

// Get current user
export function getCurrentUser() {  
  const userStr = localStorage.getItem("telegramUser");
  return userStr ? JSON.parse(userStr) : null;
}

// Get user ID from Telegram user data
export function getUserId() {
  const user = getCurrentUser();
  return user?.telegramId;
}

// Logout user
export function logout() {
  localStorage.removeItem("telegramUser");
}

async function apiJson(url, opts = {}) {
  // Add user ID to headers if available
  const userId = getUserId();
  const currentUser = getCurrentUser();
  if (userId) {
    opts.headers = {
      ...opts.headers,
      //"X-Mrr-User-Id": currentUser
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

// User-Player linking (not directly supported by API, using user endpoint instead)
export async function getUserLinkedPlayer() {
  try {
    // First get user data to find linked player

    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.telegramId) throw new Error("User not authenticated");
    
    const user = await apiJson(`${API_BASE}/api/users/${currentUser.telegramId}`);
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

export async function linkUserToPlayer(playerId) {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.telegramId) throw new Error("User not authenticated");
  
  // Using PATCH /api/users/{telegramId} with playerId query param
  return await apiJson(`${API_BASE}/api/users/${currentUser.telegramId}?playerId=${playerId}`, {
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

// Players
export async function createOrGetPlayerByName(nickName) {
  const body = JSON.stringify({ nickName });
  try {
    return await apiJson(`${API_BASE}/api/players`, {
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

export async function getPlayerByNick(nick) {
  try {
    const url = `${API_BASE}/api/players/nick/${encodeURIComponent(nick)}`;
    return await apiJson(url);
  } catch (e) {
    if (String(e.message).startsWith("404")) {
      return null;
    }
    throw new Error("Player not found by nick");
  }
}

export async function searchPlayers(query, limit = 12) {
  if (!query) return listRecentPlayers(limit);
  const url = `${API_BASE}/api/players/search?nick=${encodeURIComponent(query)}&limit=${limit}`;
  const list = await apiJson(url);
  return Array.isArray(list) ? list : [];
}

export async function listRecentPlayers(limit = 12) {
  const url = `${API_BASE}/api/players?limit=${limit}`;
  const list = await apiJson(url);
  return Array.isArray(list) ? list : [];
}

export async function listAllPlayers() {
  // Fetch all players for leaderboard
  const url = `${API_BASE}/api/players?limit=1000`;
  const list = await apiJson(url);
  return Array.isArray(list) ? list : [];
}

// Reviews
export async function fetchReviewsByPlayer(playerNick, days = 30) {
  try {
    const url = `${API_BASE}/api/reviews/nick/${encodeURIComponent(playerNick)}`;
    const list = await apiJson(url);
    return Array.isArray(list)
      ? list.map((review) => ({
          id: review.id,
          comment: review.review,
          createdAt: review.created,
          grade: review.grade,
          rank: review.rank,
          screenshotUrl: review.image,
          author: review.owner?.userName || "Anonymous",
        }))
      : [];
  } catch {
    return [];
  }
}

// Fetch reviews by current user
export async function fetchReviewsByUser() {
  try {
    const userId = getUserId();
    if (!userId) return [];
    
    const url = `${API_BASE}/api/reviews/user/${userId}`;
    const list = await apiJson(url);
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
// This functionality isn't directly supported by the API
export async function fetchReviewsOnLinkedPlayer() {
  // We can't directly fetch reviews on a player without knowing the player ID
  // This would require first getting the user's linked player, then fetching reviews for that player
  try {
    const player = await getUserLinkedPlayer();
    if (!player) return [];
    
    const url = `${API_BASE}/api/reviews/nick/${encodeURIComponent(player.nickName)}`;
    const list = await apiJson(url);
    return Array.isArray(list)
      ? list.map((review) => ({
          id: review.id,
          comment: review.review,
          createdAt: review.created,
          grade: review.grade,
          rank: review.rank,
          screenshotUrl: review.image,
          author: review.owner?.userName || "Anonymous",
        }))
      : [];
  } catch {
    return [];
  }
}

export async function addReview(payload) {
  try {
    const res = await apiJson(`${API_BASE}/api/reviews`, {
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