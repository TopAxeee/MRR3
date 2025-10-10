// src/components/TelegramLogin.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import TelegramIcon from "@mui/icons-material/Telegram";

const TelegramLogin = ({ onLoginSuccess, botName, buttonSize = "large" }) => {
  const navigate = useNavigate();

  // Handle Telegram authentication response
  const handleTelegramResponse = (data) => {
    // Send the data to your backend for validation
    fetch("/api/auth/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          // Handle successful authentication
          if (onLoginSuccess) {
            onLoginSuccess(result.user);
          } else {
            // Default navigation after login
            navigate("/");
          }
        } else {
          console.error("Telegram authentication failed:", result.error);
        }
      })
      .catch((error) => {
        console.error("Error during Telegram authentication:", error);
      });
  };

  // Load Telegram script and initialize widget
  React.useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    document.body.appendChild(script);

    // Set up callback function for Telegram response
    window.onTelegramAuth = (user) => {
      handleTelegramResponse(user);
    };

    return () => {
      document.body.removeChild(script);
      delete window.onTelegramAuth;
    };
  }, []);

  return (
    <div>
      <script
        data-telegram-login={botName}
        data-size={buttonSize}
        data-radius="20"
        data-auth-url="/api/auth/telegram"
        data-onauth="onTelegramAuth(user)"
      ></script>
    </div>
  );
};

export default TelegramLogin;