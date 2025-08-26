// src/components/Stars.jsx
import React from "react";
import Box from "@mui/material/Box";
import StarIcon from "@mui/icons-material/Star";

export default function Stars({ value = 0, size = "small" }) {
  const fullStars = Math.round(value ?? 0);
  return (
    <Box display="flex">
      {[...Array(5)].map((_, i) => (
        <StarIcon
          key={i}
          fontSize={size}
          sx={{ color: i < fullStars ? "gold" : "lightgray" }}
        />
      ))}
    </Box>
  );
}