// src/services/api.js
export const API_BASE = import.meta.env?.VITE_API_BASE || "https://marvel-rivals-reviews.onrender.com";

// Check if user is authenticated
export function isAuthenticated() {
  return !!localStorage.getItem("telegramUser") && !!localStorage.getItem("sessionToken");
}

// Get current user
export function getCurrentUser() {  
  const userStr = localStorage.getItem("telegramUser");
  return userStr ? JSON.parse(userStr) : null;
}

// Get session token
export function getSessionToken() {
  return localStorage.getItem("sessionToken");
}

// Logout user
export function logout() {
  localStorage.removeItem("telegramUser");
  localStorage.removeItem("sessionToken");
}

async function apiJson(url, opts = {}) {
  // Add session token to headers if available
  const token = getSessionToken();
  if (token) {
    opts.headers = {
      ...opts.headers,
      "Authorization": `Bearer ${token}`
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

// Players
export async function createOrGetPlayerByName(nickName) {
  const body = JSON.stringify({ nickName });
  try {
    return await apiJson(`${API_BASE}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (e) {
    if (String(e.message).startsWith("409 ")) {
      const tryUrls = [
        `${API_BASE}/players/nick/${encodeURIComponent(nickName)}`,
      ];
      for (const u of tryUrls) {
        try {
          return await apiJson(u);
        } catch {}
      }
      const list = await searchPlayers(nickName, 1);
      if (list && list.length) return list[0];
    }
    throw e;
  }
}

export async function getPlayerByNick(nick) {
  try {
    // Updated to use the new endpoint for getting a player by nickname
    const url = `${API_BASE}/players/nick/${encodeURIComponent(nick)}`;
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
  // Updated to use the new search endpoint
  const url = `${API_BASE}/players/search?nick=${encodeURIComponent(query)}`;
  const list = await apiJson(url);
  return Array.isArray(list) ? list.slice(0, limit) : [];
}

export async function listRecentPlayers(limit = 12) {
  const url = `${API_BASE}/players?limit=${limit}`;
  const list = await apiJson(url);
  return Array.isArray(list) ? list : [];
}

export async function listAllPlayers() {
  // Fetch all players for leaderboard
  // Note: In a production environment, this should be paginated
  const url = `${API_BASE}/players?limit=1000`;
  const list = await apiJson(url);
  return Array.isArray(list) ? list : [];
}

// Reviews
export async function fetchReviewsByPlayer(playerNick, days = 30) {
  try {
    const url = `${API_BASE}/reviews/nick/${encodeURIComponent(playerNick)}`;
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
    // Get user ID from local storage
    const currentUser = getCurrentUser();
    const userId = currentUser?.id;
    
    const headers = {
      "Content-Type": "application/json",
    };
    
    // Add user ID header if available
    if (userId) {
      headers["X-Mrr-User-Id"] = userId;
    }
    
    const res = await apiJson(`${API_BASE}/reviews`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return res?.id ?? null;
  } catch (e) {
    console.error("addReview failed:", e);
    return null;
  }
}