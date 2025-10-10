// src/pages/Login.jsx
import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TelegramLogin from "../components/TelegramLogin";
import { isAuthenticated } from "../services/api";

const Login = () => {
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const handleLoginSuccess = (user) => {
    // Store user info in localStorage
    localStorage.setItem("telegramUser", JSON.stringify(user));
    // Navigate to home
    navigate("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
      }}
    >
      <Paper
        sx={{
          p: 6,
          maxWidth: 500,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Typography variant="h4" sx={{ mb: 2 }}>
          Welcome to Marvel Rivals Reviews
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Please log in with your Telegram account to continue
        </Typography>
        
        <TelegramLogin 
          botName="MarvelRivalsReviewsAuthBot" 
          onLoginSuccess={handleLoginSuccess}
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Don't have a Telegram account?{" "}
          <Link to="/" style={{ color: "#1976d2" }}>
            Continue as guest
          </Link>
        </Typography>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          By logging in, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;