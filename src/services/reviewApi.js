// src/services/reviewApi.js
import { API_BASE, apiHeaders, getUserId } from './api';

// ============================================================================= 
// REVIEW CONTROLLER
// КОНТРОЛЛЕР ОТЗЫВОВ
// =============================================================================

// Simple cache for reviews data
const reviewsCache = new Map();
const REVIEWS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// GET /api/reviews/nick/{nick} - Получить отзывы игрока
// GET /api/reviews/nick/{nick} - Get player reviews
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
              author: review.userNick || "Anonymous",
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
          author: review.userNick || "Anonymous",
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
// GET /api/reviews/user - Get user reviews
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

// GET /api/reviews/player/{playerId} - Получить отзывы на игрока (для владельца игрока)
// GET /api/reviews/player/{playerId} - Get reviews on player (for player owner)
export async function fetchReviewsOnLinkedPlayer(page = 0, limit = 10) {
  try {
    // Import getCurrentUser locally to avoid circular dependency
    const { getCurrentUser } = await import('./api');
    const currentUser = getCurrentUser();
    
    if (!currentUser || !currentUser.playerId) {
      return {
        items: [],
        totalPages: 0,
        currentPage: 0,
        totalElements: 0,
        limit: limit
      };
    }

    const url = `${API_BASE}/api/reviews/player/${currentUser.playerId}?page=${page}&limit=${limit}`;
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
              author: review.userNick || "Anonymous",
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
          author: review.userNick || "Anonymous",
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
// POST /api/reviews - Create review
export async function addReview(payload) {
  const res = await apiHeaders(`${API_BASE}/api/reviews`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return res?.id ?? null;
}

// Проверить, может ли пользователь оставить отзыв на игрока
// Check if user can review player
export async function canUserReviewPlayer(playerId) {
  // В настоящее время бэкенд не предоставляет отдельного endpoint для проверки
  // возможности оставить отзыв, поэтому мы просто возвращаем true
  // Ограничение (1 отзыв в 10 дней) будет проверяться на сервере при отправке отзыва
  return true;
}