// src/components/Pagination.jsx
import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // Don't show pagination if there's only one page
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <Box 
      sx={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        gap: 2, 
        mt: 3,
        mb: 2
      }}
    >
      <Button 
        onClick={handlePrev} 
        disabled={currentPage === 0}
        variant="outlined"
        size="small"
      >
        Previous
      </Button>
      
      <Typography variant="body2">
        Page {currentPage + 1} of {totalPages}
      </Typography>
      
      <Button 
        onClick={handleNext} 
        disabled={currentPage >= totalPages - 1}
        variant="outlined"
        size="small"
      >
        Next
      </Button>
    </Box>
  );
}