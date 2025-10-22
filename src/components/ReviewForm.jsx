// src/components/ReviewForm.jsx
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Rating from "@mui/material/Rating";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";

import { RANK_NAMES } from "../utils";
import { canUserReviewPlayer, getPlayerByNick, isAuthenticated } from "../services/api";

export default function ReviewForm({ initialNick = "", onSubmit, submitting = false }) {
  const [playerNick, setPlayerNick] = useState(initialNick);
  const [rank, setRank] = useState("");
  const [grade, setGrade] = useState(0);
  const [comment, setComment] = useState("");
  const [canReview, setCanReview] = useState(true);
  const [reviewCheckLoading, setReviewCheckLoading] = useState(false);
  const [playerId, setPlayerId] = useState(null);

  // Check if user can review this player (10-day restriction)
  useEffect(() => {
    const checkReviewPermission = async () => {
      if (!playerNick.trim()) return;
      
      try {
        setReviewCheckLoading(true);
        // First get the player ID
        const player = await getPlayerByNick(playerNick.trim());
        if (player) {
          setPlayerId(player.id);
          // Then check if user can review this player
          const canReviewResult = await canUserReviewPlayer(player.id);
          setCanReview(canReviewResult);
        } else {
          setCanReview(true); // Allow review for new players
        }
      } catch (err) {
        console.error("Error checking review permission:", err);
        setCanReview(true); // Allow review if there's an error
      } finally {
        setReviewCheckLoading(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkReviewPermission, 500);
    return () => clearTimeout(timeoutId);
  }, [playerNick]);

  const isFormValid = playerNick.trim() !== "" && rank !== "" && grade > 0 && canReview;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    onSubmit({
      playerNick: playerNick.trim(),
      rank: Number(rank),
      grade: Number(grade),
      comment: comment.trim(),
      screenshotUrl: null,
    });

    setComment("");
    setGrade(0);
    setRank("");
  };

  // Check if user is authenticated
  const userAuthenticated = isAuthenticated();

  return (
    <Paper sx={{ p: 2, mb: 2, position: "relative" }}>
      {!userAuthenticated && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            borderRadius: 1,
          }}
        >
          <Box sx={{ textAlign: "center", p: 2 }}>
            <Typography variant="h6" color="white" sx={{ mb: 2 }}>
              Authentication Required
            </Typography>
            <Typography variant="body1" color="white" sx={{ mb: 2 }}>
              You need to be logged in to submit a review
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/login"
            >
              Login with Telegram
            </Button>
          </Box>
        </Box>
      )}
      
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="Player Nick"
          value={playerNick}
          onChange={(e) => setPlayerNick(e.target.value)}
          required
          disabled={submitting || !userAuthenticated}
        />

        {!canReview && (
          <Alert severity="warning">
            You can only leave one review per player every 10 days. Please wait before submitting another review for this player.
          </Alert>
        )}

        <FormControl fullWidth required disabled={submitting || !userAuthenticated}>
          <InputLabel>Rank</InputLabel>
          <Select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            label="Rank"
          >
            {RANK_NAMES.map((name, idx) => (
              <MenuItem key={idx} value={idx}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography>Grade:</Typography>
          <Rating
            name="grade"
            value={grade}
            onChange={(_, newValue) => setGrade(newValue || 0)}
            disabled={submitting || !userAuthenticated}
          />
        </Box>

        <TextField
          label="Comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          multiline
          rows={3}
          disabled={submitting || !userAuthenticated}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={!isFormValid || submitting || reviewCheckLoading || !userAuthenticated}
        >
          {submitting ? "Submitting…" : reviewCheckLoading ? "Checking..." : "Submit"}
        </Button>
      </Box>
    </Paper>
  );
}