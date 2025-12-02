// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { isAuthenticated, getCurrentUser, logout, isAdmin } from "../services/api";

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        try {
          const currentUser = getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // If we have a token but no user data, logout to clean up
            logout();
          }
        } catch (e) {
          console.error("Error parsing user data:", e);
          // Clear invalid user data
          logout();
        }
      }
    };

    checkAuth();
    
    // Listen for storage changes (in case user logs in/out in another tab)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate("/");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ 
            color: "white", 
            textDecoration: "none", 
            flexGrow: 1,
            fontWeight: "bold",
          }}
        >
          Marvel Rivals Reviews
        </Typography>
        
        {user ? (
          <>
            <Button 
              component={Link} 
              to="/myprofile" 
              color="inherit"
              sx={{
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)"
                },
                mr: 1
              }}
            >
              My Profile
            </Button>
            <Button 
              component={Link} 
              to="/leaderboard" 
              color="inherit"
              sx={{
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)"
                },
                mr: 1
              }}
            >
              Leaderboard
            </Button>
            <Button 
              onClick={handleLogout}
              color="inherit"
              sx={{
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)"
                },
                mr: 1
              }}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button 
              component={Link} 
              to="/leaderboard" 
              color="inherit"
              sx={{
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)"
                },
                mr: 1
              }}
            >
              Leaderboard
            </Button>
            <Button 
              component={Link} 
              to="/login" 
              color="inherit"
              sx={{
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)"
                }
              }}
            >
              Login
            </Button>
          </>
        )}
        
        {user && isAdmin() && (
          <Button 
            component={Link} 
            to="/admin" 
            color="inherit"
            sx={{
              fontWeight: "bold",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)"
              },
              ml: 1
            }}
          >
            Admin
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}