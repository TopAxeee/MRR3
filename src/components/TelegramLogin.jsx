// src/components/TelegramLogin.jsx
import React, { useState, useEffect, useRef } from "react";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import { API_BASE } from "../services/api";

const TelegramLogin = ({ onLoginSuccess, onError, botName, buttonSize = "large" }) => {
  const containerRef = useRef(null);
  const [showUIDPrompt, setShowUIDPrompt] = useState(false);
  const [uid, setUID] = useState('');
  const [verifyingUID, setVerifyingUID] = useState(false);
  const [error, setError] = useState(null);
  const [tempUserData, setTempUserData] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedPlayerInfo, setConfirmedPlayerInfo] = useState(null);

  // Handle Telegram authentication response
  const handleTelegramResponse = (data) => {    
    // Validate that we received data
    if (!data || !data.id) {
      console.error("Invalid Telegram auth data received:", data);
      if (onError) {
        onError("Invalid authentication data received from Telegram. Please try again.");
      }
      return;
    }
    
    // Send the data to your backend for validation
    fetch(`${API_BASE}/api/auth/telegram`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ authData: data }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        if (result.success) {
          // Store user data temporarily and show UID prompt for new users
          setTempUserData({
            user: result.user,
            token: result.token
          });
          
          // Check if user already has playerUid - if not, show UID prompt
          if (!result.user.playerUid) {
            setShowUIDPrompt(true);
          } else {
            // If user already has playerUid, proceed with login
            localStorage.setItem("telegramUser", JSON.stringify(result.user));
            localStorage.setItem("sessionToken", result.token);
            
            if (onLoginSuccess) {
              onLoginSuccess(result.user);
            } else {
              // If no callback provided, redirect to home
              window.location.href = '/';
            }
          }
        } else {
          const errorMessage = result.error || "Telegram authentication failed";
          console.error("Telegram authentication failed:", errorMessage);
          if (onError) {
            onError(errorMessage);
          }
        }
      })
      .catch((error) => {
        console.error("Error during Telegram authentication:", error);
        if (onError) {
          onError("Network error during authentication: " + error.message);
        }
      });
  };

  // Verify UID against game API and show confirmation
  const verifyUID = async () => {
    if (!uid.trim()) {
      setError("UID is required");
      if (onError) onError("UID is required");
      return;
    }
    
    setVerifyingUID(true);
    setError(null);
    
    try {
      // Verify UID against game API to get player information
      const gameApiKey = import.meta.env.VITE_GAME_API_KEY || "c9df835f1961daec64c259b01955ae88266fc4989ecee338273ccf2f8095b140";
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
      const playerNick = parsedResult.name || `Player_${uid}`;
      
      // Show confirmation screen with player info
      setConfirmedPlayerInfo({
        uid: uid,
        nick: playerNick
      });
      setShowConfirmation(true);
      setShowUIDPrompt(false);
      
    } catch (err) {
      console.error("Error verifying UID:", err);
      setError("Failed to verify UID. Please check the UID and try again.");
      if (onError) {
        onError("Failed to verify UID. Please check the UID and try again.");
      }
    } finally {
      setVerifyingUID(false);
    }
  };

  // Confirm player info and update user
  const confirmPlayerInfo = async () => {
    if (!tempUserData || !confirmedPlayerInfo) {
      setError("Missing user or player data");
      if (onError) onError("Missing user or player data");
      return;
    }
    
    try {
      // Make PATCH request to link the confirmed UID and nickname to the user
      const response = await fetch(`${API_BASE}/api/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: tempUserData.user.playerId || null, // Use existing playerId if available
          playerUid: confirmedPlayerInfo.uid,
          playerNick: confirmedPlayerInfo.nick
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedUser = await response.json();
      
      // Store the updated user information
      localStorage.setItem("telegramUser", JSON.stringify(updatedUser));
      localStorage.setItem("sessionToken", tempUserData.token);
      
      // Successful UID verification and linking - trigger login success
      if (onLoginSuccess) {
        onLoginSuccess(updatedUser);
      } else {
        // If no callback provided, redirect to home
        window.location.href = '/';
      }
      
    } catch (err) {
      console.error("Error confirming player info:", err);
      setError("Failed to confirm player information. Please try again.");
      if (onError) {
        onError("Failed to confirm player information. Please try again.");
      }
    }
  };

  // Reject player info and go back to UID input
  const rejectPlayerInfo = () => {
    // Go back to UID prompt to allow user to enter a different UID
    setShowConfirmation(false);
    setShowUIDPrompt(true);
    setUID('');
  };

  // Create Telegram widget using the approach from your widget
  const createTelegramWidget = () => {
    if (containerRef.current) {
      // Clear container
      containerRef.current.innerHTML = '';
      
      // Create the script element for Telegram widget
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      
      // Set attributes to match your widget
      script.setAttribute('data-telegram-login', botName);
      script.setAttribute('data-size', buttonSize);
      script.setAttribute('data-onauth', 'window.handleTelegramAuthCallback(user)');
      
      containerRef.current.appendChild(script);
    }
  };

  // Initialize Telegram widget
  useEffect(() => {
    
    // Validate bot name
    if (!botName) {
      console.error("Telegram bot name is not configured");
      if (onError) {
        onError("Telegram bot is not properly configured. Please contact administrator.");
      }
      return;
    }
    
    // Set up global callback
    window.handleTelegramAuthCallback = handleTelegramResponse;
    
    // Create the Telegram widget
    createTelegramWidget();
    
    // Add error handling for script loading
    const handleError = (event) => {
      console.error("Error loading Telegram widget:", event);
      if (onError) {
        onError("Failed to load Telegram authentication widget. Please check your connection and try again.");
      }
    };
    
    // Listen for script loading errors
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src.includes('telegram-widget')) {
        scripts[i].addEventListener('error', handleError);
      }
    }
    
    return () => {
      // Clean up
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      delete window.handleTelegramAuthCallback;
    };
  }, [botName, buttonSize]);

  // Render the appropriate view based on state
  if (showUIDPrompt) {
    return (
      <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2, textAlign: 'left', border: '1px solid #ccc', borderRadius: '4px', p: 2, display: 'inline-block', width: '100%', maxWidth: 400 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>Enter Game UID</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter your unique identifier from the game:
          </Typography>
          
          <TextField
            fullWidth
            label="Game UID"
            value={uid}
            onChange={(e) => setUID(e.target.value)}
            margin="normal"
            placeholder="Enter your unique game identifier"
            disabled={verifyingUID}
          />
          
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={verifyUID}
              disabled={verifyingUID || !uid.trim()}
              sx={{ ml: 1 }}
            >
              {verifyingUID ? 'Verifying...' : 'Verify UID'}
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }
  
  if (showConfirmation && confirmedPlayerInfo) {
    return (
      <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2, textAlign: 'left', border: '1px solid #ccc', borderRadius: '4px', p: 2, display: 'inline-block', width: '100%', maxWidth: 400 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>Confirm Your Profile</Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Is this your profile?
          </Typography>
          
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="body2"><strong>Nickname:</strong> {confirmedPlayerInfo.nick}</Typography>
            <Typography variant="body2"><strong>UID:</strong> {confirmedPlayerInfo.uid}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button 
              variant="outlined" 
              onClick={rejectPlayerInfo}
              disabled={verifyingUID}
            >
              Enter Again
            </Button>
            <Button 
              variant="contained" 
              onClick={confirmPlayerInfo}
              disabled={verifyingUID}
              sx={{ ml: 1 }}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <div ref={containerRef} id="telegram-login-container">
      {/* Telegram widget will be injected here */}
      {!botName && (
        <div style={{ color: 'red' }}>
          Telegram bot not configured. Please set VITE_TELEGRAM_BOT_NAME in .env file.
        </div>
      )}
    </div>
  );
};

export default TelegramLogin;