// src/components/TelegramLogin.jsx
import React, { useEffect, useRef } from "react";
import { API_BASE } from "../services/api";

const TelegramLogin = ({ onLoginSuccess, onError, botName, buttonSize = "large" }) => {
  const containerRef = useRef(null);

  // Handle Telegram authentication response
  const handleTelegramResponse = (data) => {
    console.log("Telegram auth data received:", data);
    
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
        console.log("Backend response status:", response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log("Backend response data:", result);
        if (result.success) {
          // Store both user info and session token
          localStorage.setItem("telegramUser", JSON.stringify(result.user));
          localStorage.setItem("sessionToken", result.token);
          
          // Handle successful authentication
          if (onLoginSuccess) {
            onLoginSuccess(result.user);
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
      
      console.log("Creating Telegram widget with bot:", botName);
      containerRef.current.appendChild(script);
    }
  };

  // Initialize Telegram widget
  useEffect(() => {
    console.log("Initializing Telegram widget with bot:", botName);
    
    // Validate bot name
    if (!botName) {
      console.error("Telegram bot name is not configured");
      if (onError) {
        onError("Telegram bot is not properly configured. Please contact administrator.");
      }
      return;
    }
    
    // Log environment information for debugging
    console.log("Telegram auth environment:", {
      botName: botName,
      apiBase: API_BASE,
      isDev: import.meta.env.DEV,
      domain: window.location.origin
    });
    
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