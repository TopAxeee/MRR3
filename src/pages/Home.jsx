// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";

import PlayersGrid from "../components/PlayersGrid";
import ReviewForm from "../components/ReviewForm";
import SuccessModal from "../components/SuccessModal";
import { searchPlayers, listAllPlayers, createOrGetPlayerByName, addReview, isAuthenticated } from "../services/api";
import { useDebouncedValue } from "../utils";

// Function to get random items from an array
function getRandomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export default function Home() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 400);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [randomPlayers, setRandomPlayers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Set document title when component mounts
  useEffect(() => {
    document.title = "Marvel Rivals Reviews";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const list = await listAllPlayers();
      if (!cancelled) setRandomPlayers(getRandomItems(list, 8));
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (debounced) {
      setLoading(true);
      (async () => {
        const list = await searchPlayers(debounced);
        if (!cancelled) setResults(list);
        if (!cancelled) setLoading(false);
      })();
    } else {
      if (!cancelled) setResults([]);
    }
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const handleSubmit = async (f) => {
    try {
      setSubmitting(true);
      const p = await createOrGetPlayerByName(f.playerNick);
      await addReview({
        playerId: p.id,
        rank: f.rank,
        grade: f.grade,
        review: f.comment,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h2" component="h1" sx={{ mb: 2, fontWeight: "bold" }}>
          Marvel Rivals Reviews
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Rate and review Marvel Rivals players
        </Typography>
      </Box>

      {!isAuthenticated() ? (
        <Paper sx={{ p: 2, mb: 3, position: "relative" }}>
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
          <ReviewForm submitting={submitting} onSubmit={handleSubmit} />
        </Paper>
      ) : (
        <Paper sx={{ p: 2, mb: 3 }}>
          <ReviewForm submitting={submitting} onSubmit={handleSubmit} />
        </Paper>
      )}

      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Review Submitted!"
        message="Your review has been submitted successfully."
      />

      <Divider sx={{ my: 4 }} />

      <Typography variant="h4" sx={{ mb: 2 }}>
        Search Players
      </Typography>
      <TextField
        fullWidth
        label="Search by nickname"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ mb: 3 }}
      />
      <PlayersGrid players={results.length ? results : randomPlayers} loading={loading} />

      <Divider sx={{ my: 4 }} />

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body1">
          <strong>How it works:</strong> Search for a player by nickname, then submit a review with their rank and rating.
          All reviews are anonymous - your identity is only visible to admins.
        </Typography>
      </Alert>
    </Container>
  );
}