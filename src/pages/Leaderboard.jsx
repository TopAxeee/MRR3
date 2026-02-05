// src/pages/Leaderboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

import PlayersGrid from "../components/PlayersGrid";
import { listAllPlayers } from "../services/playerApi";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [sortBy, setSortBy] = useState("reviews"); // Default sort by reviews count
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set document title when component mounts
  useEffect(() => {
    document.title = "MRR Leaderboard";
  }, []);

  // Fetch all players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const playersData = await listAllPlayers();
        setPlayers(playersData);
        setFilteredPlayers(playersData);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch players:", err);
        setError("Failed to load leaderboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Apply sorting when sortBy changes or players data updates
  useEffect(() => {
    if (!players.length) return;

    let sortedPlayers = [...players];
    
    switch (sortBy) {
      case "reviews":
        // Sort by number of reviews (descending)
        sortedPlayers.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
      case "rank":
        // Sort by highest average rank (descending)
        sortedPlayers.sort((a, b) => (b.avgRank || 0) - (a.avgRank || 0));
        break;
      case "rating":
        // Sort by highest average rating (descending)
        sortedPlayers.sort((a, b) => (b.avgGrade || 0) - (a.avgGrade || 0));
        break;
      default:
        // Default to sorting by reviews
        sortedPlayers.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
    }

    setFilteredPlayers(sortedPlayers);
  }, [players, sortBy]);

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
          Player Leaderboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Discover the top players based on different metrics
        </Typography>
        
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={handleSortChange}
            >
              <MenuItem value="reviews">Most Reviews</MenuItem>
              <MenuItem value="rank">Highest Average Rank</MenuItem>
              <MenuItem value="rating">Highest Rating</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {filteredPlayers.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No players found
          </Typography>
        </Box>
      ) : (
        <PlayersGrid items={filteredPlayers} />
      )}
    </Box>
  );
}