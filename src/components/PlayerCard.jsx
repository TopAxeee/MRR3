// src/components/PlayerCard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";
import Button from "@mui/material/Button";

import Stars from "./Stars";
import RankBadge from "./RankBadge";
import { RANK_NAMES } from "../utils";
import { clamp } from "../utils";

// Функция для генерации градиента на основе строки
const generateGradient = (str) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export default function PlayerCard({ player }) {
  const navigate = useNavigate();
  const initials = player?.nickName?.[0]?.toUpperCase() ?? "?";
  const avatarGradient = useMemo(
    () => generateGradient(player?.nickName || ""),
    [player?.nickName]
  );

  // Use player stats directly from the player object
  const stats = {
    avgRank: player.avgRank,
    avgGrade: player.avgGrade,
    reviewCount: player.reviewCount || 0
  };

  const rankValue = stats?.avgRank != null ? clamp(Math.round(stats.avgRank), 0, RANK_NAMES.length - 1) : null;
  const reviewCount = stats?.reviewCount || 0;

  // Функция для расчета размера шрифта в зависимости от длины никнейма
  const getFontSize = (nickname) => {
    const length = nickname.length;
    if (length > 20) return "0.75rem";
    if (length > 15) return "0.875rem";
    if (length > 10) return "1rem";
    return "1.125rem";
  };

  const handleViewProfile = (e) => {
    e.stopPropagation();
    navigate(`/player/${player.nickName}`);
  };

  return (
      <Card 
        sx={{ 
          flex: 1,          // растягиваем по доступному месту
          height: 320,      // фиксируем только высоту (increased from 280 to 320)
          width: '100%',
          minWidth: 0,
          borderRadius: 3,
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s ease",
          background: "linear-gradient(145deg, #1e293b 0%, #334155 100%)",
          border: "1px solid #334155",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 25px -8px rgba(0, 0, 0, 0.5)",
          }
        }}
      >
      <CardActionArea 
        onClick={() => navigate(`/player/${player.nickName}`)}
        sx={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column",
          p: 2,
          height: "100%",
        }}
      >
        <CardContent sx={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          justifyContent: "space-between",
          textAlign: "center",
          width: "100%",
          height: "100%",
          padding: "16px !important",
          "&:last-child": { pb: 2 }
        }}>
          {/* Avatar container with rank badge positioned on top-right */}
          <Box sx={{ 
            mb: 1,
            position: "relative",
            width: 96,
            height: 96
          }}>
            {player.image ? (
              <Avatar 
                alt={player.nickName} 
                src={player.image}
                sx={{ 
                  width: 96, 
                  height: 96,
                  mx: "auto",
                  border: "3px solid #334155"
                }} 
              />
            ) : (
              <Avatar 
                sx={{ 
                  width: 96, 
                  height: 96,
                  mx: "auto",
                  background: avatarGradient,
                  fontSize: "2rem",
                  fontWeight: "bold"
                }}
              >
                {initials}
              </Avatar>
            )}
            {/* Rank Badge positioned on top-right of avatar */}
            {rankValue != null && (
              <Box sx={{ 
                position: "absolute", 
                top: -8, 
                right: -8,
                zIndex: 10
              }}>
                <RankBadge rank={rankValue} size="small" />
              </Box>
            )}
          </Box>

          {/* Nickname - с фиксированной высотой и переносом */}
          <Box sx={{ 
            height: 48, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            mb: 1
          }}>
            <Typography 
              sx={{ 
                fontWeight: "bold",
                fontSize: getFontSize(player.nickName),
                wordBreak: "break-word",
                lineHeight: 1.2,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}
            >
              {player.nickName}
            </Typography>
          </Box>

          {/* Rating and Stars - фиксированная высота */}
          <Box sx={{ 
            height: 40, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center",
            alignItems: "center",
            mb: 1
          }}>
            {stats?.avgGrade != null ? (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Stars value={stats.avgGrade} size="small" />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: "bold",
                      color: "primary.light"
                    }}
                  >
                    {stats.avgGrade.toFixed(1)}
                  </Typography>
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                >
                  {reviewCount} review{reviewCount !== 1 ? 's' : ''}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No reviews
              </Typography>
            )}
          </Box>

          {/* View Profile Button - фиксированная внизу */}
          <Button 
            variant="contained" 
            size="small"
            onClick={handleViewProfile}
            sx={{
              width: "100%",
              borderRadius: 2,
              fontWeight: "bold",
              py: 1
            }}
          >
            View Profile
          </Button>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}