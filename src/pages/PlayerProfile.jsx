// src/pages/PlayerProfile.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";

import Stars from "../components/Stars";
import ReviewForm from "../components/ReviewForm";
import ReviewsList from "../components/ReviewsList";
import SuccessModal from "../components/SuccessModal";
import {
  getPlayerByNick,
  getPlayerStats,
  createOrGetPlayerByName,
  addReview,
} from "../services/api";
import { colorFromString, clamp, RANK_NAMES } from "../utils";

export default function PlayerProfile() {
  const { nick } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const p = await getPlayerByNick(nick);
        if (cancelled) return;
        setPlayer(p);

        if (p?.id) {
          const playerStats = await getPlayerStats(p.id);
          if (!cancelled) setStats(playerStats);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nick]);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    window.location.reload();
  };

  const handleReviewSubmit = async (f) => {
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

  if (loading) return <Typography>Loading…</Typography>;
  if (!player) {
    return (
      <Box>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Not found. Create first review below!
        </Typography>
        <Paper sx={{ p: 2, mb: 3 }}>
          <ReviewForm
            initialNick={nick}
            submitting={submitting}
            onSubmit={handleReviewSubmit}
          />
        </Paper>
        <SuccessModal
          open={showSuccessModal}
          onClose={handleSuccessModalClose}
          title="Review Submitted!"
          message="Your review has been submitted successfully. The page will refresh to show your changes."
        />
      </Box>
    );
  } else {
    const avatarBg = colorFromString(player.nickName || "");
    const rankLabel =
      stats?.avgRank != null
        ? RANK_NAMES[clamp(Math.round(stats.avgRank), 0, RANK_NAMES.length - 1)]
        : "No rank in 30 days";

    return (
      <div>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: avatarBg, width: 72, height: 72 }}>
            {player.nickName?.[0]?.toUpperCase() ?? "?"}
          </Avatar>
          <div>
            <Typography variant="h4">{player.nickName}</Typography>
            {stats?.avgGrade != null && (
              <Stars value={stats.avgGrade} size="large" />
            )}
            <Typography variant="h6">{rankLabel}</Typography>
          </div>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6">Leave a review</Typography>
          <ReviewForm
            initialNick={player.nickName}
            submitting={submitting}
            onSubmit={handleReviewSubmit}
          />
        </Paper>

        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          All reviews
        </Typography>
        <ReviewsList playerNick={player.nickName} />

        <SuccessModal
          open={showSuccessModal}
          onClose={handleSuccessModalClose}
          title="Review Submitted!"
          message="Your review has been submitted successfully. The page will refresh to show your changes."
        />
      </div>
    );
  }
}
