// src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function Header() {
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
            background: "linear-gradient(45deg, #ffffff 30%, #fbbf24 90%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Marvel Rivals Reviews
        </Typography>
        <Button 
          component={Link} 
          to="/admin" 
          color="inherit"
          sx={{
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)"
            }
          }}
        >
          Admin
        </Button>
      </Toolbar>
    </AppBar>
  );
}