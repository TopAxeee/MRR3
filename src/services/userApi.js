// src/services/userApi.js
import { API_BASE, apiHeaders, getCurrentUser, getUserId } from './api';

// ============================================================================= 
// USER CONTROLLER
// КОНТРОЛЛЕР ПОЛЬЗОВАТЕЛЕЙ
// =============================================================================

// Simple cache for user linked player data
const userPlayerCache = new Map();
const USER_PLAYER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/users - Получить пользователя по TelegramId
// GET /api/users - Get user by TelegramId
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
// PATCH /api/users - Link player to user
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
// GET /api/users/all - Get all users
// Not implemented yet

// Create a new user account
export async function createUserAccount(userData) {
  try {
    const response = await fetch(`${API_BASE}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating user account:", error);
    throw error;
  }
}

// Verify player UID against game API and link to user
export async function verifyAndLinkPlayer(uid, gameApiKey = "c9df835f1961daec64c259b01955ae88266fc4989ecee338273ccf2f8095b140") {
  try {
    // Verify UID against game API
    const myHeaders = new Headers();
    myHeaders.append("x-api-key", gameApiKey);
    
    const requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };
    
    const gameApiResponse = await fetch(`https://marvelrivalsapi.com/api/v1/player/${uid}`, requestOptions);
    
    if (!gameApiResponse.ok) {
      throw new Error(`Game API error! status: ${gameApiResponse.status}`);
    }
    
    const gameResult = await gameApiResponse.text();
    
    // Parse the result to extract player information
    let parsedResult;
    try {
      parsedResult = JSON.parse(gameResult);
    } catch (e) {
      // If it's not JSON, treat the response text as is
      console.warn('Game API did not return JSON, treating as text:', gameResult);
      parsedResult = { id: 0, name: `Player_${uid}` };
    }
    
    // Extract player information from the response
    const playerId = parsedResult.id || parsedResult.playerId || 0;
    
    // Now make a PATCH request to link the player to the user
    const linkResponse = await fetch(`${API_BASE}/api/users?playerId=${playerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerUid: uid,
        nickName: parsedResult.name
      })
    });
    
    if (!linkResponse.ok) {
      throw new Error(`HTTP error during user update! status: ${linkResponse.status}`);
    }
    
    return await linkResponse.json();
  } catch (error) {
    console.error("Error verifying and linking player:", error);
    throw error;
  }
}