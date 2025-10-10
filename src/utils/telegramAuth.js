// src/utils/telegramAuth.js
/**
 * Validates Telegram authentication data
 * This function should be implemented on the server side for security
 * @param {Object} authData - Telegram authentication data
 * @param {string} botToken - Your Telegram bot token
 * @returns {boolean} - Whether the data is valid
 */
export function validateTelegramAuthData(authData, botToken) {
  // This is a simplified version - in production, this MUST be implemented server-side
  // because the bot token should never be exposed to the client
  
  const requiredFields = ['id', 'first_name', 'auth_date', 'hash'];
  for (const field of requiredFields) {
    if (!authData[field]) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }

  // In a real implementation, you would:
  // 1. Create a string with sorted authData keys (excluding hash)
  // 2. Create a SHA256 hash of the bot token
  // 3. Create an HMAC-SHA256 hash of the data string using the token hash
  // 4. Compare the result with the provided hash
  
  // For now, we'll just check that required fields exist
  // NEVER use this simplified validation in production!
  
  // Check that auth_date is not too old (e.g., within 1 day)
  const authDate = new Date(authData.auth_date * 1000);
  const now = new Date();
  const timeDiff = Math.abs(now - authDate);
  const diffHours = Math.ceil(timeDiff / (1000 * 60 * 60));
  
  if (diffHours > 24) {
    console.error("Authentication data is too old");
    return false;
  }
  
  return true;
}

/**
 * Creates a user object from Telegram auth data
 * @param {Object} authData - Telegram authentication data
 * @returns {Object} - User object
 */
export function createUserFromTelegramData(authData) {
  return {
    id: authData.id,
    firstName: authData.first_name,
    lastName: authData.last_name || null,
    username: authData.username || null,
    photoUrl: authData.photo_url || null,
    authDate: new Date(authData.auth_date * 1000),
  };
}