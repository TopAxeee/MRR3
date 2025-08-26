// src/components/ReviewForm.jsx
import React, { useState } from "react";
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

import { RANK_NAMES } from "../utils";

export default function ReviewForm({ initialNick = "", onSubmit, submitting = false }) {
  const [playerNick, setPlayerNick] = useState(initialNick);
  const [rank, setRank] = useState("");
  const [grade, setGrade] = useState(0);
  const [comment, setComment] = useState("");

  const isFormValid = playerNick.trim() !== "" && rank !== "" && grade > 0;

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

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
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
          disabled={submitting}
        />

        <FormControl fullWidth required disabled={submitting}>
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
            disabled={submitting}
          />
        </Box>

        <TextField
          label="Comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          multiline
          rows={3}
          disabled={submitting}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={!isFormValid || submitting}
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </Box>
    </Paper>
  );
}