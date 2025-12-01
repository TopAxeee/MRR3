// src/components/RankBadge.jsx
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const RANK_COLORS = {
  0: "linear-gradient(135deg, #cd7f32 0%, #8c6b46 100%)", // Bronze
  1: "linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%)", // Silver
  2: "linear-gradient(135deg, #ffd700 0%, #daa520 100%)", // Gold
  3: "linear-gradient(135deg,rgb(0, 252, 240) 0%,rgb(25, 231, 159) 100%)", // Platinum
  4: "linear-gradient(135deg,rgb(0, 208, 255) 0%,rgb(0, 100, 146) 100%)", // Diamond
  5: "linear-gradient(135deg,rgb(157, 0, 255) 0%,rgb(67, 0, 80) 100%)", // Vibranium
  6: "linear-gradient(135deg,rgb(209, 143, 11) 0%,rgb(181, 81, 10) 100%)", // Celestial
  7: "linear-gradient(135deg,rgb(248, 86, 188) 0%,rgb(242, 3, 218) 100%)", // Eternity+
};

const RANK_NAMES = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "GrandMaster", "Celestial", "Eternity+"];

export default function RankBadge({ rank, size = "medium" }) {
  const rankIndex = Math.min(Math.max(0, rank), RANK_NAMES.length - 1);
  const rankName = RANK_NAMES[rankIndex];
  const gradient = RANK_COLORS[rankIndex] || RANK_COLORS[0];

  const sizes = {
    small: { padding: "4px 12px", fontSize: "0.75rem" },
    medium: { padding: "6px 16px", fontSize: "0.875rem" },
    large: { padding: "8px 20px", fontSize: "1rem" },
  };

  return (
    <Box
      sx={{
        background: gradient,
        borderRadius: 20,
        padding: sizes[size].padding,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "none", // Removed box shadow to match new design
      }}
    >
      <Typography
        sx={{
          color: "white",
          fontWeight: "bold",
          fontSize: sizes[size].fontSize,
          textShadow: "none", // Removed text shadow to match new design
          lineHeight: 1,
        }}
      >
        {rankName}
      </Typography>
    </Box>
  );
}