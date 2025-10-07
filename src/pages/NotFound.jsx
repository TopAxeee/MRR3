// src/pages/NotFound.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function NotFound() {
  // Set document title when component mounts
  useEffect(() => {
    document.title = "404 MRR";
  }, []);

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
        <ErrorOutlineIcon
          sx={{
            fontSize: 80,
            color: "warning.main",
          }}
        />
        
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "4rem", sm: "6rem" },
            fontWeight: "bold",
            color: "text.primary",
            lineHeight: 1,
          }}
        >
          404
        </Typography>
        
        <Typography
          variant="h4"
          sx={{
            fontSize: { xs: "1.5rem", sm: "2rem" },
            fontWeight: "medium",
            color: "text.primary",
            mb: 1,
          }}
        >
          Page Not Found
        </Typography>
        
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 2, maxWidth: 400 }}
        >
          The page you are looking for doesn't exist or has been moved. 
          Please check the URL or navigate back to the homepage.
        </Typography>
        
        <Button
          component={Link}
          to="/"
          variant="contained"
          size="large"
          sx={{
            minWidth: 150,
            py: 1.5,
          }}
        >
          Go to Homepage
        </Button>
      </Paper>
    </Box>
  );
}