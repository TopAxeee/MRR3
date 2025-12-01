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
import ErrorModal from "../components/ErrorModal";
import { searchPlayers, listAllPlayers, createOrGetPlayerByName, addReview } from "../services/api";
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
  const [errorModal, setErrorModal] = useState({ open: false, title: "", message: "" });

  // Set document title when component mounts
  useEffect(() => {
    document.title = "Marvel Rivals Reviews";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (debounced) {
          const list = await searchPlayers(debounced, 8);
          if (!cancelled) setResults(list);
        } else {
          const allPlayers = await listAllPlayers();
          const randomSelection = getRandomItems(allPlayers, 8);
          if (!cancelled) setRandomPlayers(randomSelection);
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

  const handleErrorModalClose = () => {
    setErrorModal({ ...errorModal, open: false });
  };

  const handleError = (error) => {
    console.error("Error submitting review:", error);
    
    // Handle specific error cases
    if (error.message && error.message.includes("REVIEW_TOO_EARLY")) {
      // Extract the date from the error message if available
      const dateMatch = error.message.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : "soon";
      
      setErrorModal({
        open: true,
        title: "Review Submission Limit",
        message: `You can only leave one review per player every 10 days. Please wait until ${date} to submit another review for this player.`
      });
    } else if (error.message && error.message.startsWith("403")) {
      setErrorModal({
        open: true,
        title: "Permission Denied",
        message: "You don't have permission to submit this review. Please make sure you're logged in and try again."
      });
    } else if (error.message && error.message.startsWith("500")) {
      setErrorModal({
        open: true,
        title: "Server Error",
        message: "Server error occurred while submitting your review. Please try again later."
      });
    } else {
      setErrorModal({
        open: true,
        title: "Submission Error",
        message: "An error occurred while submitting your review. Please try again."
      });
    }
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
            Random players
          </Typography>
          <PlayersGrid items={randomPlayers} />
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
            const reviewId = await addReview({
              playerId: p.id,
              rank: f.rank,
              grade: f.grade,
              review: f.comment,
            });
            
            // Only show success modal if we got a valid review ID back
            if (reviewId) {
              setShowSuccessModal(true);
            } else {
              // This shouldn't happen with our updated API service, but just in case
              handleError(new Error("Failed to submit review - no ID returned"));
            }
          } catch (error) {
            handleError(error);
            throw error; // Re-throw to be handled by ReviewForm
          } finally {
            setSubmitting(false);
          }
        }}
        onSuccess={() => setShowSuccessModal(true)}
        onError={handleError}
      />

      <SuccessModal
        open={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Review Submitted!"
        message="Your review has been submitted successfully. The page will refresh to show your changes."
      />
      
      <ErrorModal
        open={errorModal.open}
        onClose={handleErrorModalClose}
        title={errorModal.title}
        message={errorModal.message}
      />
    </Container>
  );
}