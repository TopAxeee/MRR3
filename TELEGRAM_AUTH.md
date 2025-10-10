# Telegram Authentication Implementation Guide

This document explains how to implement Telegram authentication for the Marvel Rivals Reviews application.

## Overview

Telegram Login allows users to authenticate using their Telegram accounts. The implementation involves:
1. Frontend: Displaying the Telegram Login button
2. Backend: Validating the authentication data from Telegram
3. Session Management: Storing and managing user sessions

## Frontend Implementation

The frontend components have already been created:
- `src/components/TelegramLogin.jsx` - Telegram login button component
- `src/pages/Login.jsx` - Login page
- `src/components/Header.jsx` - Updated to show user status

## Backend Implementation

You need to implement the `/api/auth/telegram` endpoint on your backend server. Here's a Node.js/Express example:

```javascript
// Example backend implementation (Node.js/Express)
const crypto = require('crypto');

// Your Telegram bot token (KEEP THIS SECRET!)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

app.post('/api/auth/telegram', (req, res) => {
  const authData = req.body;
  
  // Validate the Telegram authentication data
  if (!validateTelegramAuthData(authData, TELEGRAM_BOT_TOKEN)) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid Telegram authentication data' 
    });
  }
  
  // Create or update user in your database
  const user = {
    telegramId: authData.id,
    firstName: authData.first_name,
    lastName: authData.last_name,
    username: authData.username,
    photoUrl: authData.photo_url,
    authDate: new Date(authData.auth_date * 1000)
  };
  
  // Save user to database (implementation depends on your DB)
  // const savedUser = saveUserToDatabase(user);
  
  // Create session token
  const sessionToken = generateSessionToken(user.telegramId);
  
  // Return success response
  res.json({
    success: true,
    user: user,
    token: sessionToken
  });
});

function validateTelegramAuthData(authData, botToken) {
  // Check required fields
  const requiredFields = ['id', 'first_name', 'auth_date', 'hash'];
  for (const field of requiredFields) {
    if (!authData[field]) {
      return false;
    }
  }

  // Create data check string
  const dataCheckArr = [];
  for (const key in authData) {
    if (key !== 'hash') {
      dataCheckArr.push(`${key}=${authData[key]}`);
    }
  }
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');

  // Create secret key
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();

  // Create HMAC-SHA256 hash
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Compare hashes
  return hash === authData.hash;
}

function generateSessionToken(telegramId) {
  // Implement your session token generation logic
  // This could be a JWT, UUID, or any other token system
  return crypto.randomBytes(32).toString('hex');
}
```

## Firebase Implementation (Alternative)

If you want to use Firebase for authentication, here's an alternative approach:

```javascript
// Firebase implementation example
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  // ... your config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// In your Telegram auth endpoint
app.post('/api/auth/telegram', async (req, res) => {
  const authData = req.body;
  
  // Validate Telegram data (same as above)
  if (!validateTelegramAuthData(authData, TELEGRAM_BOT_TOKEN)) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid Telegram authentication data' 
    });
  }
  
  // Create custom token for Firebase
  const customToken = await admin.auth().createCustomToken(authData.id.toString());
  
  res.json({
    success: true,
    customToken: customToken,
    user: {
      id: authData.id,
      firstName: authData.first_name,
      lastName: authData.last_name,
      username: authData.username
    }
  });
});
```

## Security Considerations

1. **Never expose your bot token** to the frontend
2. **Always validate authentication data on the server side**
3. **Use HTTPS in production**
4. **Implement rate limiting for authentication endpoints**
5. **Store session tokens securely**

## Required Environment Variables

You need to set the following environment variables:
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `DOMAIN` - Your website domain (e.g., marvel-reviews.com)

## Testing

To test the implementation:
1. Start your development server
2. Navigate to the login page
3. Click the Telegram Login button
4. Complete the authentication flow
5. Verify that user data is stored and sessions are managed correctly

## Troubleshooting

Common issues:
1. **"Invalid hash" errors** - Check that your bot token is correct
2. **CORS issues** - Ensure your backend allows requests from your frontend domain
3. **Widget not loading** - Check that your bot is properly configured in Telegram

For more information, refer to the official Telegram Login documentation:
https://core.telegram.org/widgets/login