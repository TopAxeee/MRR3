// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import PlayersGrid from "../components/PlayersGrid";
import ReviewForm from "../components/ReviewForm";
import SuccessModal from "../components/SuccessModal";
import { searchPlayers, listRecentPlayers, createOrGetPlayerByName, addReview } from "../services/api";
import { useDebouncedValue } from "../utils";

export default function Home() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 400);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Set document title when component mounts
  useEffect(() => {
    document.title = "Marvel Rivals reviews";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (debounced) {
          const list = await searchPlayers(debounced, 12);
          if (!cancelled) setResults(list);
        } else {
          const list = await listRecentPlayers(8);
          if (!cancelled) setRecent(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    window.location.reload();
  };

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ my: 2 }}>
        <TextField
          fullWidth
          label="Search player by nickname"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Box>
      {debounced ? (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Search results
          </Typography>
          <Container sx={{ py: 4 }}>
            <PlayersGrid items={results} />
          </Container>
        </>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Recently added
          </Typography>
          <PlayersGrid items={recent} />
        </>
      )}
      {loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      )}
      <Divider sx={{ my: 4 }} />
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quick review
      </Typography>
      <ReviewForm
        submitting={submitting}
        onSubmit={async (f) => {
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
        }}
      />

      <SuccessModal
        open={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Review Submitted!"
        message="Your review has been submitted successfully. The page will refresh to show your changes."
      />
    </Container>
  );
}