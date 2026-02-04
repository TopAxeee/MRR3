// src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Box from "@mui/material/Box";

import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import TelegramLogin from "../components/TelegramLogin";
import MockTelegramLogin from "../components/MockTelegramLogin"; // Import the mock login component
import { isAuthenticated } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const handleLoginSuccess = (user) => {
    // Clear any previous errors
    setError(null);
    setLoading(true);
    // Navigate to home
    navigate("/");
  };

  const handleLoginError = (errorMessage) => {
    setError(errorMessage);
    setLoading(false);
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
          Welcome to Marvel Rivals Reviews test
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Please log in with your Telegram account to continue
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        )}
        
        {loading && (
          <Alert severity="info" sx={{ width: "100%" }}>
            Authenticating... Please wait.
          </Alert>
        )}
        
        {/* Added wrapper to prevent potential button nesting issues */}
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <TelegramLogin 
            botName={import.meta.env.VITE_TELEGRAM_BOT_NAME || "MarvelRivalsReviewsAuthBot"}
            onLoginSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
        </Box>
        
        {/* Add Mock Telegram Login Option */}
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 2 }}>
          <MockTelegramLogin 
            onLoginSuccess={handleLoginSuccess}
            onError={handleLoginError}
          />
        </Box>
        
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