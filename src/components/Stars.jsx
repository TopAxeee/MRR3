// src/components/Stars.jsx
import React from "react";
import Box from "@mui/material/Box";
import StarIcon from "@mui/icons-material/Star";

export default function Stars({ value = 0, size = "small" }) {
  const clampedValue = Math.max(0, Math.min(5, value ?? 0));
  
  const starSizes = {
    small: { fontSize: 18 },
    medium: { fontSize: 24 },
    large: { fontSize: 32 }
  };

  const starSize = starSizes[size].fontSize;

  return (
    <Box display="flex" gap={0.5}>
      {[...Array(5)].map((_, i) => {
        const starValue = Math.max(0, Math.min(1, clampedValue - i));
        const percentage = starValue * 100;
        
        return (
          <Box 
            key={i} 
            sx={{ 
              position: 'relative', 
              width: starSize, 
              height: starSize,
              overflow: 'hidden'
            }}
          >
            {/* Empty star */}
            <StarIcon
              sx={{ 
                ...starSizes[size], 
                color: "text.secondary",
                position: 'absolute',
                top: 0,
                left: 0
              }}
            />
            {/* Filled star - clipped to show the percentage */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                overflow: 'hidden',
                width: `${percentage}%`
              }}
            >
              <StarIcon
                sx={{ 
                  ...starSizes[size], 
                  color: "#fbbf24", // Bright yellow
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}