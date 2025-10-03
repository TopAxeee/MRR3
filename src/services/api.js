// src/services/api.js
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8080";

async function apiJson(url, opts = {}) {
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

export async function getPlayerStats(playerId) {
  try {
    // This function is no longer needed as the player stats (avgRank and avgGrade) 
    // are now included in the player object from getPlayerByNick
    return null;
  } catch {
    return null;
  }
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
    const res = await apiJson(`${API_BASE}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mrr-User-Id": "1",
      },
      body: JSON.stringify(payload),
    });
    return res?.id ?? null;
  } catch (e) {
    console.error("addReview failed:", e);
    return null;
  }
}