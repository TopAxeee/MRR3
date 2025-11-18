// src/components/PlayersGrid.jsx
import React from "react";
import Grid from "@mui/material/Grid";
import PlayerCard from "./PlayerCard";

export default function PlayersGrid({ items }) {
  return (
    <Grid container sx={{ width: "100%" }}>
      {items.map((p) => (
        <Grid item key={p.id} sx={{ flex: "1 1 25%", maxWidth: "25%", p: 1 }}>
          <PlayerCard player={p} />
        </Grid>
      ))}
    </Grid>
  );
}