// src/pages/PlayerProfile.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import CheckIcon from "@mui/icons-material/Check";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";

import Stars from "../components/Stars";
import ReviewForm from "../components/ReviewForm";
import ReviewsList from "../components/ReviewsList";
import SuccessModal from "../components/SuccessModal";
import RankBadge from "../components/RankBadge";
import {
  getPlayerByNick,
  createOrGetPlayerByName,
  addReview,
  isAuthenticated,
  getUserLinkedPlayer
} from "../services/api";
import { clamp, RANK_NAMES } from "../utils";

// Функция для генерации градиента на основе строки (скопирована из PlayerCard)
const generateGradient = (str) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export default function PlayerProfile() {
  const { nick } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLinkedPlayer, setIsLinkedPlayer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const p = await getPlayerByNick(nick);
        if (cancelled) return;
        setPlayer(p);
        
        // Check if this is the current user's linked player
        if (p && isAuthenticated()) {
          try {
            const linkedPlayer = await getUserLinkedPlayer();
            setIsLinkedPlayer(linkedPlayer && linkedPlayer.id === p.id);
          } catch (err) {
            console.error("Error checking if player is linked:", err);
          }
        }
        
        // Update document title when player data is loaded
        if (p && p.nickName) {
          document.title = `${p.nickName} MRR`;
        } else {
          document.title = `${nick} MRR`;
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
    // Update document title for new players
    document.title = `${nick} MRR`;
    
    return (
      <Box>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          Not found. Create first review below!
        </Typography>
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
            <ReviewForm
              initialNick={nick}
              submitting={submitting}
              onSubmit={handleReviewSubmit}
            />
          </Paper>
        ) : (
          <Paper sx={{ p: 2, mb: 3 }}>
            <ReviewForm
              initialNick={nick}
              submitting={submitting}
              onSubmit={handleReviewSubmit}
            />
          </Paper>
        )}
        <SuccessModal
          open={showSuccessModal}
          onClose={handleSuccessModalClose}
          title="Review Submitted!"
          message="Your review has been submitted successfully. The page will refresh to show your changes."
        />
      </Box>
    );
  } else {
    // Use the same gradient generation as in PlayerCard
    const avatarGradient = generateGradient(player.nickName || "");
    const initials = player?.nickName?.[0]?.toUpperCase() ?? "?";
    
    // Use player stats directly from the player object
    const rankValue = player.avgRank != null ? clamp(Math.round(player.avgRank), 0, RANK_NAMES.length - 1) : null;

    return (
      <div>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          {/* Updated avatar to use the same gradient as PlayerCard */}
          <Avatar 
            sx={{ 
              background: avatarGradient, 
              width: 72, 
              height: 72,
              fontSize: "2rem",
              fontWeight: "bold"
            }}
          >
            {initials}
          </Avatar>
          <div>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h4">{player.nickName}</Typography>
              {isLinkedPlayer && (
                <CheckIcon color="success" sx={{ fontSize: "1.5rem" }} />
              )}
            </Box>
            {player.avgGrade != null && (
              <Stars value={player.avgGrade} size="large" />
            )}
            {/* Using RankBadge component instead of plain text */}
            {rankValue != null ? (
              <RankBadge rank={rankValue} size="large" />
            ) : (
              <Typography variant="h6">No rank in 30 days</Typography>
            )}
          </div>
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
            <ReviewForm
              initialNick={player.nickName}
              submitting={submitting}
              onSubmit={handleReviewSubmit}
            />
          </Paper>
        ) : (
          <Paper sx={{ p: 2, mb: 3 }}>
            <ReviewForm
              initialNick={player.nickName}
              submitting={submitting}
              onSubmit={handleReviewSubmit}
            />
          </Paper>
        )}

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