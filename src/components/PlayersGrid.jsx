// src/components/PlayersGrid.jsx
import React from "react";
import Grid from "@mui/material/Grid";
import PlayerCard from "./PlayerCard";

export default function PlayersGrid({ items }) {
  return (
    <Grid container spacing={2}>
      {items.map((p) => (
        <Grid item key={p.id ?? p.nickName} xs={12} sm={6} md={4} lg={3}>
          <PlayerCard player={p} />
        </Grid>
      ))}
    </Grid>
  );
}