// src/pages/UserProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import CheckIcon from "@mui/icons-material/Check";

import { 
  isAuthenticated, 
  getCurrentUser, 
  getPlayerByNick, 
  createOrGetPlayerByName,
  linkUserToPlayer,
  fetchReviewsByUser,
  fetchReviewsOnLinkedPlayer
} from "../services/api";
import ReviewItem from "../components/ReviewItem";
import { getUserLinkedPlayer } from "../services/api";
import Pagination from "../components/Pagination";

// Function to generate gradient for avatar (same as in PlayerCard)
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

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [linkedPlayer, setLinkedPlayer] = useState(null);
  const [playerInput, setPlayerInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [playerReviews, setPlayerReviews] = useState({ 
    items: [], 
    currentPage: 0, 
    totalPages: 0, 
    totalElements: 0 
  });

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Set document title
    document.title = "My Profile - MRR";
    
    // Load user's linked player if any
    loadLinkedPlayer();
  }, [navigate]);

  const loadLinkedPlayer = async () => {
    try {
      setLoading(true);
      console.log("Loading linked player...");
      const player = await getUserLinkedPlayer();
      console.log("Linked player data:", player);
      setLinkedPlayer(player);
      
      // If player is linked, load reviews
      if (player) {
        await loadReviews(player);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error loading linked player:", err);
      setError("Failed to load profile information");
      setLoading(false);
    }
  };

  const loadReviews = async (player) => {
    try {
      // Load reviews by user
      const userReviewsData = await fetchReviewsByUser();
      setUserReviews(userReviewsData);
      
      // Load reviews on player (first page)
      const playerReviewsData = await fetchReviewsOnLinkedPlayer(0, 10);
      setPlayerReviews(playerReviewsData);
    } catch (err) {
      console.error("Error loading reviews:", err);
    }
  };

  const handlePlayerReviewsPageChange = async (newPage) => {
    try {
      const playerReviewsData = await fetchReviewsOnLinkedPlayer(newPage, 10);
      setPlayerReviews(playerReviewsData);
    } catch (err) {
      console.error("Error loading reviews:", err);
    }
  };

  const handleLinkPlayer = async (e) => {
    e.preventDefault();
    if (!playerInput.trim()) return;
    
    try {
      setLinking(true);
      setError(null);
      setSuccess(null);
      
      // Create or get player by nickname
      const player = await createOrGetPlayerByName(playerInput.trim());
      
      // Link user to player
      await linkUserToPlayer(player.id);
      
      // Update state
      setLinkedPlayer(player);
      setSuccess("Player linked successfully!");
      
      // Load reviews for the newly linked player
      await loadReviews(player);
      
      // Clear input
      setPlayerInput("");
    } catch (err) {
      console.error("Error linking player:", err);
      setError("Failed to link player: " + err.message);
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Alert severity="error">
        You must be logged in to view this page. <Link href="/login">Login here</Link>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Profile
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Account Information
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          {user.photoUrl && (
            <Box
              component="img"
              src={user.photoUrl}
              alt="Profile"
              sx={{ width: 64, height: 64, borderRadius: "50%" }}
            />
          )}
          <Box>
            <Typography variant="h6">
              {user.firstName} {user.lastName || ""}
            </Typography>
            {user.username && (
              <Typography variant="body2" color="text.secondary">
                @{user.username}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Link to Player
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Link your Telegram account to an in-game player nickname. This will allow you to leave reviews and see your review history.
        </Typography>
        
        {linkedPlayer ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: generateGradient(linkedPlayer.nickName),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                fontSize: "1.2rem"
              }}
            >
              {linkedPlayer.nickName?.[0]?.toUpperCase() || "?"}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {linkedPlayer.nickName}
                <CheckIcon color="success" fontSize="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Linked player account
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleLinkPlayer} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label="Player Nickname"
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              disabled={linking}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={linking || !playerInput.trim()}
              startIcon={linking ? <CircularProgress size={20} /> : null}
            >
              {linking ? "Linking..." : "Link Player"}
            </Button>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </Paper>
      
      {linkedPlayer && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Player Profile
          </Typography>
          <Button
            variant="outlined"
            href={`/player/${linkedPlayer.nickName}`}
            sx={{ mb: 3 }}
          >
            View Full Player Profile
          </Button>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Reviews by You
            </Typography>
            {userReviews.length > 0 ? (
              <Box sx={{ mb: 3 }}>
                {userReviews.map((review) => (
                  <Box key={review.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      Review for <Link href={`/player/${review.playerNick}`}>{review.playerNick}</Link>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(review.createdAt).toLocaleString()}
                    </Typography>
                    <Typography sx={{ mt: 1 }}>
                      {review.comment || "No comment"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You haven't left any reviews yet.
              </Typography>
            )}
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Reviews on Your Player Profile
            </Typography>
            {playerReviews.items.length > 0 ? (
              <Box sx={{ mb: 3 }}>
                {playerReviews.items.map((review) => (
                  <Box key={review.id} sx={{ mb: 2 }}>
                    <ReviewItem review={review} />
                  </Box>
                ))}
                
                {playerReviews.totalElements > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                    Showing {playerReviews.items.length} of {playerReviews.totalElements} reviews
                  </Typography>
                )}
                
                <Pagination 
                  currentPage={playerReviews.currentPage} 
                  totalPages={playerReviews.totalPages} 
                  onPageChange={handlePlayerReviewsPageChange} 
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No reviews on your player profile yet.
              </Typography>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}