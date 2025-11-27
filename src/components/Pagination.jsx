// src/components/Pagination.jsx
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const [pageInput, setPageInput] = useState("");
  
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

  const handleFirst = () => {
    if (currentPage > 0) {
      onPageChange(0);
    }
  };

  const handleLast = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(totalPages - 1);
    }
  };

  const handlePageInputChange = (e) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page - 1); // Convert to 0-based index
      setPageInput("");
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(0);
      
      // Show ellipsis if needed
      if (currentPage > 2) {
        pages.push("ellipsis-start");
      }
      
      // Show pages around current page
      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Show ellipsis if needed
      if (currentPage < totalPages - 3) {
        pages.push("ellipsis-end");
      }
      
      // Show last page
      pages.push(totalPages - 1);
    }
    
    return pages;
  };

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "center", 
        alignItems: "center", 
        gap: 2, 
        mt: 3,
        mb: 2
      }}
    >
      {/* First page button */}
      <IconButton 
        onClick={handleFirst} 
        disabled={currentPage === 0}
        sx={{ 
          bgcolor: "primary.main",
          color: "white",
          "&:hover": { bgcolor: "primary.dark" },
          "&.Mui-disabled": { 
            bgcolor: "rgba(0, 0, 0, 0.12)",
            color: "rgba(0, 0, 0, 0.26)"
          }
        }}
      >
        <FirstPageIcon />
      </IconButton>
      
      {/* Previous button */}
      <Button 
        onClick={handlePrev} 
        disabled={currentPage === 0}
        sx={{ 
          bgcolor: "primary.main",
          color: "white",
          "&:hover": { bgcolor: "primary.dark" },
          "&.Mui-disabled": { 
            bgcolor: "rgba(0, 0, 0, 0.12)",
            color: "rgba(0, 0, 0, 0.26)"
          }
        }}
      >
        Previous
      </Button>
      
      {/* Page numbers */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {getPageNumbers().map((page, index) => {
          if (page === "ellipsis-start" || page === "ellipsis-end") {
            return (
              <Typography key={index} variant="body2" sx={{ mx: 0.5 }}>
                ...
              </Typography>
            );
          }
          
          return (
            <Button
              key={page}
              onClick={() => onPageChange(page)}
              variant={currentPage === page ? "contained" : "outlined"}
              sx={{
                minWidth: "32px",
                height: "32px",
                bgcolor: currentPage === page ? "primary.main" : "white",
                color: currentPage === page ? "white" : "primary.main",
                borderColor: "primary.main",
                "&:hover": {
                  bgcolor: currentPage === page ? "primary.dark" : "primary.light",
                  color: "white",
                  borderColor: "primary.dark"
                }
              }}
            >
              {page + 1}
            </Button>
          );
        })}
      </Box>
      
      {/* Next button */}
      <Button 
        onClick={handleNext} 
        disabled={currentPage >= totalPages - 1}
        sx={{ 
          bgcolor: "primary.main",
          color: "white",
          "&:hover": { bgcolor: "primary.dark" },
          "&.Mui-disabled": { 
            bgcolor: "rgba(0, 0, 0, 0.12)",
            color: "rgba(0, 0, 0, 0.26)"
          }
        }}
      >
        Next
      </Button>
      
      {/* Last page button */}
      <IconButton 
        onClick={handleLast} 
        disabled={currentPage >= totalPages - 1}
        sx={{ 
          bgcolor: "primary.main",
          color: "white",
          "&:hover": { bgcolor: "primary.dark" },
          "&.Mui-disabled": { 
            bgcolor: "rgba(0, 0, 0, 0.12)",
            color: "rgba(0, 0, 0, 0.26)"
          }
        }}
      >
        <LastPageIcon />
      </IconButton>
      
      {/* Page input for quick navigation */}
      <Box 
        component="form" 
        onSubmit={handlePageInputSubmit}
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 1,
          mt: { xs: 2, sm: 0 }
        }}
      >
        <TextField
          type="text"
          value={pageInput}
          onChange={handlePageInputChange}
          placeholder="Page #"
          size="small"
          sx={{ width: "80px" }}
        />
        <Button 
          type="submit"
          variant="contained"
          size="small"
          sx={{ 
            height: "40px",
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" }
          }}
        >
          Go
        </Button>
      </Box>
      
      {/* Page info */}
      <Typography variant="body2" sx={{ mt: { xs: 2, sm: 0 } }}>
        Page {currentPage + 1} of {totalPages}
      </Typography>
    </Box>
  );
}