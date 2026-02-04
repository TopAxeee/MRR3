import React, { useState } from "react";
import { Box, TextField, Button, Typography, Alert, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const MockTelegramLogin = ({ onLoginSuccess, onError }) => {
  const [formData, setFormData] = useState({
    id: "",
    first_name: "",
    last_name: "",
    username: "",
    photo_url: "",
    auth_date: Math.floor(Date.now() / 1000).toString(),
    hash: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHash, setShowHash] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.id || !formData.first_name) {
      setError("Telegram ID and First Name are required");
      if (onError) onError("Telegram ID and First Name are required");
      return;
    }

    try {
      // Generate a mock hash if not provided
      const authData = {
        ...formData,
        id: parseInt(formData.id),
        auth_date: parseInt(formData.auth_date),
        hash: formData.hash || "mock_hash_for_testing_" + Date.now()
      };

      // Simulate the same API call as TelegramLogin
      const response = await fetch(`${import.meta.env?.VITE_API_BASE || "https://marvel-rivals-reviews.onrender.com"}/api/auth/telegram`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authData }),
      });

      if (!response.ok) {
        // If the backend is not available, simulate a successful response
        if (response.status === 404 || response.status >= 500) {
          console.warn("Backend not available, simulating successful authentication");
          
          // Create a mock user object similar to what the backend would return
          const mockUser = {
            id: authData.id,
            firstName: authData.first_name,
            lastName: authData.last_name || null,
            username: authData.username || null,
            photoUrl: authData.photo_url || null,
            telegramId: authData.id,
            authDate: new Date(authData.auth_date * 1000),
          };
          
          const mockResult = {
            success: true,
            user: mockUser,
            token: "mock_jwt_token_for_testing_" + Date.now()
          };
          
          // Store both user info and session token (same as TelegramLogin)
          localStorage.setItem("telegramUser", JSON.stringify(mockResult.user));
          localStorage.setItem("sessionToken", mockResult.token);
          
          // Handle successful authentication
          if (onLoginSuccess) {
            onLoginSuccess(mockResult.user);
          }
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Store both user info and session token (same as TelegramLogin)
        localStorage.setItem("telegramUser", JSON.stringify(result.user));
        localStorage.setItem("sessionToken", result.token);
        
        // Handle successful authentication
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      } else {
        const errorMessage = result.error || "Telegram authentication failed";
        console.error("Mock Telegram authentication failed:", errorMessage);
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (err) {
      console.error("Error during mock Telegram authentication:", err);
      
      // If there's a network error, simulate a successful response
      if (err.message.includes("Network error") || err.message.includes("Failed to fetch")) {
        console.warn("Network error occurred, simulating successful authentication");
        
        // Create a mock user object similar to what the backend would return
        const mockUser = {
          id: parseInt(formData.id),
          firstName: formData.first_name,
          lastName: formData.last_name || null,
          username: formData.username || null,
          photoUrl: formData.photo_url || null,
          telegramId: parseInt(formData.id),
          authDate: new Date(parseInt(formData.auth_date) * 1000),
        };
        
        const mockResult = {
          success: true,
          user: mockUser,
          token: "mock_jwt_token_for_testing_" + Date.now()
        };
        
        // Store both user info and session token (same as TelegramLogin)
        localStorage.setItem("telegramUser", JSON.stringify(mockResult.user));
        localStorage.setItem("sessionToken", mockResult.token);
        
        // Handle successful authentication
        if (onLoginSuccess) {
          onLoginSuccess(mockResult.user);
        }
        return;
      }
      
      setError("Network error during authentication: " + err.message);
      if (onError) {
        onError("Network error during authentication: " + err.message);
      }
    }
  };

  const generateMockData = () => {
    const mockId = Math.floor(Math.random() * 1000000000);
    const mockNames = ["John", "Jane", "Alex", "Maria", "David", "Sarah", "Mike", "Emma", "Chris", "Lisa"];
    const mockFirst = mockNames[Math.floor(Math.random() * mockNames.length)];
    const mockLast = mockNames[Math.floor(Math.random() * mockNames.length)];
    
    setFormData({
      id: mockId.toString(),
      first_name: mockFirst,
      last_name: mockLast,
      username: `user${mockId}`,
      photo_url: "",
      auth_date: Math.floor(Date.now() / 1000).toString(),
      hash: "mock_hash_for_testing_" + Date.now()
    });
  };

  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      <Button 
        variant="outlined" 
        onClick={() => setShowForm(!showForm)}
        sx={{ mb: 2 }}
      >
        {showForm ? "Cancel Mock Login" : "Use Mock Telegram Login"}
      </Button>
      
      {showForm && (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, textAlign: 'left', border: '1px solid #ccc', borderRadius: '4px', p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>Mock Telegram Authentication</Typography>
          
          <TextField
            fullWidth
            label="Telegram ID*"
            name="id"
            value={formData.id}
            onChange={handleChange}
            margin="normal"
            required
            type="number"
            helperText="Unique numeric identifier for the user"
          />
          
          <TextField
            fullWidth
            label="First Name*"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            margin="normal"
            required
          />
          
          <TextField
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Photo URL"
            name="photo_url"
            value={formData.photo_url}
            onChange={handleChange}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Auth Date (Unix Timestamp)"
            name="auth_date"
            value={formData.auth_date}
            onChange={handleChange}
            margin="normal"
            helperText="Defaults to current time"
          />
          
          <Button 
            variant="text" 
            size="small" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            sx={{ mb: 1 }}
          >
            {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
          </Button>
          
          {showAdvanced && (
            <>
              <TextField
                fullWidth
                label="Hash (Optional)"
                name="hash"
                type={showHash ? "text" : "password"}
                value={formData.hash}
                onChange={handleChange}
                margin="normal"
                helperText="Will be auto-generated if left empty"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle hash visibility"
                        onClick={() => setShowHash(!showHash)}
                        edge="end"
                      >
                        {showHash ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={generateMockData} size="small">
              Generate Random Data
            </Button>
            <Button type="submit" variant="contained" sx={{ ml: 1 }}>
              Create Account
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MockTelegramLogin;