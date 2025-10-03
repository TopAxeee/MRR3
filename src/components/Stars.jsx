// src/components/Stars.jsx
import React from "react";
import Box from "@mui/material/Box";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

export default function Stars({ value = 0, size = "small" }) {
  const fullStars = Math.round(value ?? 0);
  
  const starSizes = {
    small: { fontSize: 18 },
    medium: { fontSize: 24 },
    large: { fontSize: 32 }
  };

  return (
    <Box display="flex" gap={0.5}>
      {[...Array(5)].map((_, i) => (
        i < fullStars ? (
          <StarIcon
            key={i}
            sx={{ 
              ...starSizes[size], 
              color: "#fbbf24" // Яркий желтый
            }}
          />
        ) : (
          <StarBorderIcon
            key={i}
            sx={{ 
              ...starSizes[size], 
              color: "text.secondary" 
            }}
          />
        )
      ))}
    </Box>
  );
}