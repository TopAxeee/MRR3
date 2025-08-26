// src/components/Header.jsx
import React from "react";
import { Link } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export default function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ color: "white", textDecoration: "none" }}
        >
          Marvel Rivals Reviews
        </Typography>
      </Toolbar>
    </AppBar>
  );
}