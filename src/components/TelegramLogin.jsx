// src/components/TelegramLogin.jsx
import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Alert, CircularProgress } from "@mui/material";
import { API_BASE } from "../services/api";

const TelegramLogin = ({ onLoginSuccess, onError, botName, buttonSize = "large" }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const [authCode, setAuthCode] = useState(null);
  const [pollingIntervalId, setPollingIntervalId] = useState(null);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
  }, [pollingIntervalId]);

  // Handle Telegram login button click
  const handleTelegramLogin = async () => {
    setLoading(true);
    setError(null);
    setPolling(false);
    
    try {
      // Make request to init authentication
      const response = await fetch(`${API_BASE}/api/auth/telegram/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Store the auth code
      setAuthCode(result.authCode);
      
      // Open the bot link in a new tab/window
      window.open(result.botLink, '_blank');
      
      // Start polling for authentication status
      startPolling(result.authCode);
    } catch (err) {
      console.error("Error initializing Telegram authentication:", err);
      setError("Failed to initialize Telegram authentication. Please try again.");
      if (onError) {
        onError("Failed to initialize Telegram authentication: " + err.message);
      }
      setLoading(false);
    }
  };

  // Start polling for authentication status
  const startPolling = (code) => {
    setPolling(true);
    setLoading(true);
    
    // Create interval to poll every 2 seconds
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/telegram/status/${code}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 404 || response.status === 410 || response.status === 500) {
            const errorResult = await response.json().catch(() => ({}));
            throw new Error(`Authentication error: ${response.status} - ${errorResult.message || 'Unknown error'}`);
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const result = await response.json();

        // If authenticated successfully
        if (result.authenticated) {
          // Clear the polling interval
          clearInterval(intervalId);
          // Update state to stop polling
          setPollingIntervalId(null);
          setPolling(false);
          setLoading(false);
          
          // Save token to localStorage
          localStorage.setItem("sessionToken", result.token || "");
          
          // Store user data in localStorage if provided
          if (result.userId) {
            const userData = {
              telegramId: result.userTelegramId, // Assuming userTelegramId is the telegramId
              isAuthenticated: true,
              // Add any other user properties that were returned
              ...result.user
            };
            localStorage.setItem("telegramUser", JSON.stringify(userData));
            console.log(localStorage.getItem("telegramUser"))
            console.log(userData)
          }

          // Trigger login success callback
          if (onLoginSuccess) {
            onLoginSuccess(result.user || { id: result.userId });
          } else {
            // Redirect to homepage if no callback provided
            window.location.href = '/';
          }
        }
      } catch (err) {
        console.error("Error polling authentication status:", err);
        // Clear the polling interval on error
        clearInterval(intervalId);
        setPollingIntervalId(null);
        setPolling(false);
        setLoading(false);
        setError(err.message || "Error polling authentication status");
        if (onError) {
          onError("Error during authentication: " + err.message);
        }
      }
    }, 2000); // Poll every 2 seconds

    setPollingIntervalId(intervalId);
  };

  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Button
          variant="contained"
          size={buttonSize}
          onClick={handleTelegramLogin}
          disabled={loading}
          sx={{
            backgroundColor: '#0088cc',
            '&:hover': {
              backgroundColor: '#0066aa',
            },
            padding: buttonSize === 'large' ? '10px 20px' : '6px 16px',
            fontSize: buttonSize === 'large' ? '1rem' : '0.875rem',
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              {polling ? 'Checking Authentication...' : 'Initializing...'}
            </>
          ) : (
            'Login with Telegram'
          )}
        </Button>
      </Box>
      
      {polling && (
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Please complete the authentication in the opened Telegram window...
        </Typography>
      )}
    </Box>
  );
};

export default TelegramLogin;