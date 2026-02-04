import React, { useState } from "react";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";

const MockTelegramLogin = ({ onLoginSuccess, onError }) => {
  const [formData, setFormData] = useState({
    telegramId: "",
    userName: "",
    firstName: "",
    lastName: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

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
    if (!formData.telegramId || !formData.firstName) {
      setError("Telegram ID and First Name are required");
      if (onError) onError("Telegram ID and First Name are required");
      return;
    }

    try {
      // Prepare the user data according to the new API format
      const userData = {
        telegramId: parseInt(formData.telegramId),
        userName: formData.userName,
        firstName: formData.firstName,
        lastName: formData.lastName
      };

      // Make the API call to the new endpoint
      const response = await fetch(`${import.meta.env?.VITE_API_BASE || "https://marvel-rivals-reviews.onrender.com"}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        // If the backend is not available, simulate a successful response
        if (response.status === 404 || response.status >= 500) {
          console.warn("Backend not available, simulating successful authentication");
          
          // Create a mock user object similar to what the backend would return
          const mockUser = {
            id: userData.telegramId,
            userName: userData.userName,
            telegramId: userData.telegramId,
            firstName: userData.firstName,
            lastName: userData.lastName,
            playerId: null,
            photoUrl: "someImg",
            authDate: new Date().toISOString(),
            playerUid: null
          };
          
          // Store the user data (similar to the real response)
          localStorage.setItem("telegramUser", JSON.stringify(mockUser));
          
          // Handle successful authentication
          if (onLoginSuccess) {
            onLoginSuccess(mockUser);
          }
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process the successful response
      const result = await response.json();
      
      // Store the user data returned by the backend
      localStorage.setItem("telegramUser", JSON.stringify(result));
      
      // Handle successful authentication
      if (onLoginSuccess) {
        onLoginSuccess(result);
      }
    } catch (err) {
      console.error("Error during mock user creation:", err);
      
      // If there's a network error, simulate a successful response
      if (err.message.includes("Network error") || err.message.includes("Failed to fetch")) {
        console.warn("Network error occurred, simulating successful authentication");
        
        // Create a mock user object similar to what the backend would return
        const mockUser = {
          id: parseInt(formData.telegramId),
          userName: formData.userName,
          telegramId: parseInt(formData.telegramId),
          firstName: formData.firstName,
          lastName: formData.lastName,
          playerId: null,
          photoUrl: "someImg",
          authDate: new Date().toISOString(),
          playerUid: null
        };
        
        // Store the user data (similar to the real response)
        localStorage.setItem("telegramUser", JSON.stringify(mockUser));
        
        // Handle successful authentication
        if (onLoginSuccess) {
          onLoginSuccess(mockUser);
        }
        return;
      }
      
      setError("Network error during user creation: " + err.message);
      if (onError) {
        onError("Network error during user creation: " + err.message);
      }
    }
  };

  const generateMockData = () => {
    const mockId = Math.floor(Math.random() * 1000000000);
    const mockNames = ["John", "Jane", "Alex", "Maria", "David", "Sarah", "Mike", "Emma", "Chris", "Lisa"];
    const mockFirst = mockNames[Math.floor(Math.random() * mockNames.length)];
    const mockLast = mockNames[Math.floor(Math.random() * mockNames.length)];
    
    setFormData({
      telegramId: mockId.toString(),
      userName: `user${mockId}`,
      firstName: mockFirst,
      lastName: mockLast
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
          
          <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>Mock User Creation</Typography>
                  
          <TextField
            fullWidth
            label="Telegram ID*"
            name="telegramId"
            value={formData.telegramId}
            onChange={handleChange}
            margin="normal"
            required
            type="number"
            helperText="Unique numeric identifier for the user"
          />
                  
          <TextField
            fullWidth
            label="Username"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            margin="normal"
          />
                  
          <TextField
            fullWidth
            label="First Name*"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            margin="normal"
            required
          />
                  
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            margin="normal"
          />
          
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