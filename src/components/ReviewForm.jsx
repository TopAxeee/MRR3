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
import Autocomplete from "@mui/material/Autocomplete"; // Added Autocomplete component

import { RANK_NAMES } from "../utils";
import { isAuthenticated } from "../services/api";
import { searchPlayers } from "../services/playerApi";
import { canUserReviewPlayer } from "../services/reviewApi";

export default function ReviewForm({ initialNick = "", onSubmit, submitting = false, isPlayerProfile = false, onSuccess, onError }) {
  const [playerNick, setPlayerNick] = useState(initialNick);
  const [rank, setRank] = useState("");
  const [grade, setGrade] = useState(0);
  const [comment, setComment] = useState("");
  const [canReview, setCanReview] = useState(true);
  const [reviewCheckLoading, setReviewCheckLoading] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [searchResults, setSearchResults] = useState([]); // Added state for search results
  const [loadingSearch, setLoadingSearch] = useState(false); // Added state for search loading

  // Check if user can review this player (10-day restriction)
  useEffect(() => {
    // When playerNick changes, reset the canReview state to allow re-attempts
    if (playerNick.trim()) {
      setCanReview(true);
    }
    
    const checkReviewPermission = async () => {
      if (!playerNick.trim() || !userAuthenticated) {
        setCanReview(true);
        return;
      }
      
      try {
        setReviewCheckLoading(true);
        // First get the player ID from search results if available
        const players = await searchPlayers(playerNick.trim(), 5);
        const player = players.find(p => p.nickName === playerNick.trim());
        if (player) {
          setPlayerId(player.id);
          // For now, assume user can review since the check happens on the server side
          // when the review is submitted
          setCanReview(true);
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
  }, [playerNick, userAuthenticated]);

  // Search for players as user types
  useEffect(() => {
    const searchPlayersDebounced = async () => {
      if (!playerNick.trim() || isPlayerProfile) {
        setSearchResults([]);
        return;
      }

      try {
        setLoadingSearch(true);
        const results = await searchPlayers(playerNick.trim(), 5);
        setSearchResults(results);
      } catch (err) {
        console.error("Error searching players:", err);
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    };

    const timeoutId = setTimeout(searchPlayersDebounced, 300);
    return () => clearTimeout(timeoutId);
  }, [playerNick, isPlayerProfile]);

  const isFormValid = playerNick.trim() !== "" && rank !== "" && grade > 0 && canReview;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    try {
      await onSubmit({
        playerNick: playerNick.trim(),
        rank: Number(rank),
        grade: Number(grade),
        comment: comment.trim(),
        screenshotUrl: null,
      });
      
      // Reset form only on successful submission
      setComment("");
      setGrade(0);
      setRank("");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // Check if this is a 403 error related to review restrictions
      if (error.message.includes("403") && (error.message.includes("10 дней") || error.message.includes("10 day") || error.message.includes("FORBIDDEN_ERROR"))) {
        // Update the canReview state to reflect the restriction
        setCanReview(false);
      }
      
      // Pass error to parent component for handling
      if (onError) {
        onError(error);
      }
    }
  };

  // Check if user is authenticated
  const userAuthenticated = isAuthenticated();

  return (
    <Paper sx={{ p: 2, mb: 2, position: "relative", background: "#15171C", borderRadius: 12 }}>
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
            borderRadius: 12,
          }}
        >
          <Box sx={{ textAlign: "center", p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "#E4E6EB" }}>
              Authentication Required
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: "#E4E6EB" }}>
              You need to be logged in to submit a review
            </Typography>
            <Button
              variant="contained"
              component={Link}
              href="/login"
              sx={{
                background: "linear-gradient(90deg, #7F5BFF, #0FD0FF)",
                color: "white",
                fontWeight: "bold",
                borderRadius: 12,
                padding: "12px 20px",
                boxShadow: "none",
                "&:hover": {
                  background: "linear-gradient(90deg, #6642E0, #00B8E6)",
                  boxShadow: "none",
                }
              }}
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
        {/* Modified player search with autocomplete */}
        <Autocomplete
          freeSolo
          options={searchResults}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.nickName || ''}
          value={playerNick}
          onInputChange={(_, newInputValue) => {
            setPlayerNick(newInputValue);
          }}
          onChange={(_, newValue) => {
            if (newValue) {
              const nick = typeof newValue === 'string' ? newValue : newValue.nickName;
              setPlayerNick(nick);
            }
          }}
          loading={loadingSearch}
          disabled={submitting || !userAuthenticated || isPlayerProfile}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Player Nick"
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#1A1C21',
                  borderRadius: 10,
                  color: '#E4E6EB',
                  '& fieldset': {
                    borderColor: '#30333B',
                  },
                  '&:hover fieldset': {
                    borderColor: '#7F5BFF',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#7F5BFF',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#A8ABB2',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#7F5BFF',
                },
              }}
            />
          )}
        />

        {!canReview && (
          <Alert 
            severity="warning"
            sx={{
              background: "rgba(255, 165, 0, 0.15)",
              color: "#FFA500",
              borderRadius: 2,
              borderLeft: "4px solid #FFA500",
            }}
          >
            You can only leave one review per player every 10 days. Please wait before submitting another review for this player. 
            {playerNick && ` You can review ${playerNick} again after the restriction period.`}
          </Alert>
        )}

        <FormControl 
          fullWidth 
          required 
          disabled={submitting || !userAuthenticated}
          sx={{
            '& .MuiOutlinedInput-root': {
              background: '#1A1C21',
              borderRadius: 10,
              color: '#E4E6EB',
              '& fieldset': {
                borderColor: '#30333B',
              },
              '&:hover fieldset': {
                borderColor: '#7F5BFF',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#7F5BFF',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#A8ABB2',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#7F5BFF',
            },
          }}
        >
          <InputLabel>Rank</InputLabel>
          <Select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            label="Rank"
          >
            {RANK_NAMES.map((name, idx) => (
              <MenuItem key={idx} value={idx} sx={{ color: "#E4E6EB", background: "#1A1C21" }}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography sx={{ color: "#E4E6EB" }}>Grade:</Typography>
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
          sx={{
            '& .MuiOutlinedInput-root': {
              background: '#1A1C21',
              borderRadius: 10,
              color: '#E4E6EB',
              '& fieldset': {
                borderColor: '#30333B',
              },
              '&:hover fieldset': {
                borderColor: '#7F5BFF',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#7F5BFF',
              },
            },
            '& .MuiInputLabel-root': {
              color: '#A8ABB2',
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#7F5BFF',
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={!isFormValid || submitting || reviewCheckLoading || !userAuthenticated}
          sx={{
            background: "linear-gradient(90deg, #7F5BFF, #0FD0FF)",
            color: "white",
            fontWeight: "bold",
            borderRadius: 12,
            padding: "12px 20px",
            boxShadow: "none",
            "&:hover": {
              background: "linear-gradient(90deg, #6642E0, #00B8E6)",
              boxShadow: "none",
            },
            "&.Mui-disabled": {
              background: "rgba(127, 91, 255, 0.3)",
              color: "rgba(255, 255, 255, 0.7)",
            }
          }}
        >
          {submitting ? "Submitting…" : reviewCheckLoading ? "Checking..." : "Submit"}
        </Button>
      </Box>
    </Paper>
  );
}