// src/services/playerApi.js
import { API_BASE, apiHeaders } from './api';

// ============================================================================= 
// PLAYER CONTROLLER
// КОНТРОЛЛЕР ИГРОКОВ
// =============================================================================

// Simple cache for player data to avoid duplicate requests
const playerCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// POST /api/players - Создать нового игрока
// POST /api/players - Create new player
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

// POST /api/players/createWithUid - Создать нового игрока с UID
export async function createOrGetPlayerWithUid(nickName, playerUid) {
  const body = JSON.stringify({ nickName, playerUid });
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
// GET /api/players/search - Search player by nick (partial nick)
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
// GET /api/players - Get all players. Sort by "freshness" of creation
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
            avgGrade:  player.avgGrade?.parsedValue ?? player.avgGrade,
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