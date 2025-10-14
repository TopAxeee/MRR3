// src/components/TelegramLogin.jsx
import React, { useEffect, useRef } from "react";
import Button from "@mui/material/Button";
import TelegramIcon from "@mui/icons-material/Telegram";
import { API_BASE } from "../services/api";

const TelegramLogin = ({ onLoginSuccess, onError, botName, buttonSize = "large" }) => {
  const containerRef = useRef(null);

  // Handle Telegram authentication response
  const handleTelegramResponse = (data) => {
    console.log("Telegram auth data received:", data);
    
    // Send the data to your backend for validation
    fetch(`${API_BASE}/auth/telegram`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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

  // Create Telegram widget
  const createTelegramWidget = () => {
    if (containerRef.current && window.Telegram) {
      // Clear container
      containerRef.current.innerHTML = '';
      
      // Create widget
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      
      const attributes = {
        'data-telegram-login': botName,
        'data-size': buttonSize,
        'data-radius': '20',
        'data-request-access': 'write',
        'data-onauth': 'window.handleTelegramAuthCallback(user)'
      };
      
      Object.keys(attributes).forEach(key => {
        script.setAttribute(key, attributes[key]);
      });
      
      containerRef.current.appendChild(script);
    }
  };

  // Initialize Telegram widget
  useEffect(() => {
    // Set up global callback
    window.handleTelegramAuthCallback = handleTelegramResponse;
    
    // Load Telegram script
    const loadTelegramWidget = () => {
      if (!document.getElementById('telegram-widget-script')) {
        const script = document.createElement('script');
        script.id = 'telegram-widget-script';
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.async = true;
        script.onload = () => {
          createTelegramWidget();
        };
        document.head.appendChild(script);
      } else {
        createTelegramWidget();
      }
    };
    
    // Check if Telegram is already loaded
    if (window.Telegram) {
      createTelegramWidget();
    } else {
      loadTelegramWidget();
    }
    
    return () => {
      // Clean up
      const script = document.getElementById('telegram-widget-script');
      if (script) {
        script.remove();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      delete window.handleTelegramAuthCallback;
    };
  }, [botName, buttonSize]);

  return (
    <div ref={containerRef} id="telegram-login-container">
      {/* Telegram widget will be injected here */}
    </div>
  );
};

export default TelegramLogin;