// src/services/adminApi.js
import { API_BASE, apiHeaders } from './api';

// ============================================================================= 
// ADMIN CONTROLLER
// АДМИН-КОНТРОЛЛЕР
// =============================================================================

// GET /api/admin/reviews - Получить все отзывы
// GET /api/admin/reviews - Get all reviews
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
          playerNick: review.playerNick || "Unknown Player",
          author: review.userNick || "Anonymous",
        }))
      : [];
  } catch {
    return [];
  }
}

// GET /api/admin/reviews/user/{userId} - Получить отзывы пользователя (для админов)
// GET /api/admin/reviews/user/{userId} - Get user reviews (for admins)
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
              playerNick: review.playerNick || "Unknown Player",
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
          playerNick: review.playerNick || "Unknown Player",
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

// GET /api/admin/reviews - Получить отзывы с пагинацией, поиск по нику игрока и автора
// GET /api/admin/reviews - Get reviews with pagination, search by player nick and author
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
              playerNick: review.playerNick || "Unknown Player",
              author: review.userNick || "Anonymous",
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
          author: review.userNick || "Anonymous",
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
// DELETE /api/admin/players/{nick} - Delete player
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
// DELETE /api/admin/reviews/{id} - Delete review
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
// PATCH /api/admin/players/{nick} - Update player nickname, preserving reviews
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