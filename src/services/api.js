// src/services/api.js
export const API_BASE = import.meta.env?.VITE_API_BASE || "https://marvel-rivals-reviews.onrender.com";

// =============================================================================
// CORE AUTHENTICATION FUNCTIONS
// ОСНОВНЫЕ ФУНКЦИИ АВТОРИЗАЦИИ
// =============================================================================

// Проверка авторизованности пользователя
// Check if user is authenticated
export function isAuthenticated() {
  return !!localStorage.getItem("telegramUser");
}

// Получить текущего пользователя
// Get current user
export function getCurrentUser() {  
  const userStr = localStorage.getItem("telegramUser");
  return userStr ? JSON.parse(userStr) : null;
}

// Получить Telegram ID текущего пользователя
// Get Telegram ID of current user
export function getUserId() {
  const user = getCurrentUser();
  return user?.telegramId;
}

// Проверка, имеет ли пользователь доступ к админке (через API)
// Check if user has admin access (via API)
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
// Check if user has admin access (client-side)
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
// Logout user (remove data from local storage)
export function logout() {
  localStorage.removeItem("telegramUser");
}

// =============================================================================
// API HELPER FUNCTIONS
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ API
// =============================================================================

// Добавление Telegram ID в каждый заголовок
// Add Telegram ID to each request header
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
    let errorMessage = `${res.status} ${res.statusText}`;
    
    try {
      const text = await res.text();
      // Try to parse as JSON first
      try {
        const json = JSON.parse(text);
        // If it's a JSON error response, use the message field
        if (json.message) {
          errorMessage = `${res.status} ${res.statusText}: ${json.message}`;
        } else {
          errorMessage = `${res.status} ${res.statusText}: ${text}`;
        }
      } catch {
        // If it's not JSON, use the raw text
        if (text) {
          errorMessage = `${res.status} ${res.statusText}: ${text}`;
        }
      }
    } catch (parseError) {
      // If we can't parse the error response, use the default message
      console.warn("Could not parse error response:", parseError);
    }
    
    throw new Error(errorMessage);
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

export { apiHeaders };