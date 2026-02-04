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
  const [showUIDPrompt, setShowUIDPrompt] = useState(false);
  const [uid, setUID] = useState('');
  const [verifyingUID, setVerifyingUID] = useState(false);

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
          
          // Show UID prompt after successful user creation
          setShowUIDPrompt(true);
          setShowForm(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process the successful response
      const result = await response.json();
      
      // Store the user data returned by the backend
      localStorage.setItem("telegramUser", JSON.stringify(result));
      
      // Show UID prompt after successful user creation
      setShowUIDPrompt(true);
      setShowForm(false);
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
        
        // Show UID prompt after successful user creation
        setShowUIDPrompt(true);
        setShowForm(false);
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
  
  const verifyUID = async () => {
    if (!uid.trim()) {
      setError("UID is required");
      if (onError) onError("UID is required");
      return;
    }
    
    setVerifyingUID(true);
    setError(null);
    
    try {
      // API key provided by user
      const apiKey = "c9df835f1961daec64c259b01955ae88266fc4989ecee338273ccf2f8095b140";
      
      const myHeaders = new Headers();
      myHeaders.append("x-api-key", apiKey);
      
      const requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
      };
      
      const response = await fetch(`https://marvelrivalsapi.com/api/v2/player/${uid}`, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.text();
      
      // Parse the result to extract player information
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
      } catch (e) {
        // If it's not JSON, treat the response text as is
        console.warn('Game API did not return JSON, treating as text:', result);
        // For now, we'll proceed with linking the UID without specific player data
        parsedResult = { uid: uid, name: `Player_${uid}` };
      }
      
      // Extract player information from the response
      const playerId = parsedResult.id || parsedResult.playerId || 0; // Use appropriate field from response
      
      // Update the user object in localStorage with the verified UID
      const storedUser = localStorage.getItem("telegramUser");
      let user;
      if (storedUser) {
        user = JSON.parse(storedUser);
        user.playerUid = uid; // Add the UID to the user object
        localStorage.setItem("telegramUser", JSON.stringify(user));
      }
      
      // Now make a PATCH request to link the player to the user
      // Use localhost for development, but allow override via environment variable
      const backendUrl = import.meta.env?.VITE_API_BASE || "http://localhost:8080";
      const patchResponse = await fetch(`${backendUrl}/api/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: playerId,
          playerUid: uid
        })
      });
      
      if (!patchResponse.ok) {
        throw new Error(`HTTP error during user update! status: ${patchResponse.status}`);
      }
      
      const updatedUser = await patchResponse.json();
      
      // Store the updated user information
      localStorage.setItem("telegramUser", JSON.stringify(updatedUser));
      
      // Successful UID verification and linking - trigger login success
      if (onLoginSuccess) {
        onLoginSuccess(updatedUser);
      }
      
    } catch (err) {
      console.error("Error verifying UID and linking player:", err);
      setError("Failed to verify UID and link player. Please check the UID and try again.");
      if (onError) {
        onError("Failed to verify UID and link player. Please check the UID and try again.");
      }
    } finally {
      setVerifyingUID(false);
    }
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
      
      {/* UID Prompt - shown after successful user creation */}
      {showUIDPrompt && (
        <Box sx={{ mt: 2, textAlign: 'left', border: '1px solid #ccc', borderRadius: '4px', p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
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
              variant="outlined" 
              onClick={() => {
                setShowUIDPrompt(false);
                setShowForm(true);
              }}
              disabled={verifyingUID}
            >
              Back
            </Button>
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
      )}
    </Box>
  );
};

export default MockTelegramLogin;