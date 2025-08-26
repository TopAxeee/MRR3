// src/components/PlayerCard.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";

import Stars from "./Stars";
import { getPlayerStats } from "../services/api";
import { colorFromString, clamp, RANK_NAMES } from "../utils";

export default function PlayerCard({ player }) {
  const navigate = useNavigate();
  const initials = player?.nickName?.[0]?.toUpperCase() ?? "?";
  const avatarBg = useMemo(
    () => colorFromString(player?.nickName || ""),
    [player?.nickName]
  );

  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (player.id) {
        const playerStats = await getPlayerStats(player.id);
        if (!cancelled) setStats(playerStats);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [player.id]);

  const rankLabel =
    stats?.avgRank != null
      ? RANK_NAMES[clamp(Math.round(stats.avgRank), 0, RANK_NAMES.length - 1)]
      : "No recent rank";

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardActionArea onClick={() => navigate(`/player/${player.nickName}`)}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            {player.image ? (
              <Avatar alt={player.nickName} src={player.image} />
            ) : (
              <Avatar sx={{ bgcolor: avatarBg }}>{initials}</Avatar>
            )}
            <Box>
              <Typography variant="h6">{player.nickName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {rankLabel}
              </Typography>
              {stats?.avgGrade != null && (
                <Stars value={stats.avgGrade} size="small" />
              )}
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}