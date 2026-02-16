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
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import { 
  isAuthenticated, 
  getCurrentUser
} from "../services/api";
import {
  getPlayerByNick, 
  createOrGetPlayerByName,
  createOrGetPlayerWithUid,
} from "../services/playerApi";
import {
  fetchReviewsByUser,
  fetchReviewsOnLinkedPlayer
} from "../services/reviewApi";
import ReviewItem from "../components/ReviewItem";
import { getUserLinkedPlayer } from "../services/userApi";
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
  const [playerUid, setPlayerUid] = useState("");
  const [playerNickname, setPlayerNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userReviews, setUserReviews] = useState({ 
    items: [], 
    currentPage: 0, 
    totalPages: 0, 
    totalElements: 0,
    limit: 10
  });
  const [playerReviews, setPlayerReviews] = useState({ 
    items: [], 
    currentPage: 0, 
    totalPages: 0, 
    totalElements: 0,
    limit: 10
  });
  const [activeTab, setActiveTab] = useState(0);

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
      
      // Check if the returned player object has meaningful data or just null values
      // If all key properties are null, treat it as if there's no linked player
      const hasMeaningfulData = player && (
        player.id !== null && 
        player.nickName !== null && 
        player.id !== undefined && 
        player.nickName !== undefined
      );
      
      const actualPlayer = hasMeaningfulData ? player : null;
      setLinkedPlayer(actualPlayer);
      
      // If player is linked, load reviews
      if (actualPlayer) {
        await loadReviews(actualPlayer);
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
      const userReviewsData = await fetchReviewsByUser(0, 10);
      setUserReviews(userReviewsData || { 
        items: [], 
        currentPage: 0, 
        totalPages: 0, 
        totalElements: 0,
        limit: 10
      });
      
      // Load reviews on player (first page)
      const playerReviewsData = await fetchReviewsOnLinkedPlayer(0, 10);
      setPlayerReviews(playerReviewsData || { 
        items: [], 
        currentPage: 0, 
        totalPages: 0, 
        totalElements: 0,
        limit: 10
      });
    } catch (err) {
      console.error("Error loading reviews:", err);
      // Ensure state is set to default values in case of error
      setUserReviews({ 
        items: [], 
        currentPage: 0, 
        totalPages: 0, 
        totalElements: 0,
        limit: 10
      });
      setPlayerReviews({ 
        items: [], 
        currentPage: 0, 
        totalPages: 0, 
        totalElements: 0,
        limit: 10
      });
    }
  };

  const handleUserReviewsPageChange = async (newPage) => {
    try {
      const userReviewsData = await fetchReviewsByUser(newPage, 10);
      setUserReviews(userReviewsData);
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
    if (!playerNickname.trim()) return;
    
    try {
      setLinking(true);
      setError(null);
      setSuccess(null);
      
      // Create or get player by nickname
      const player = await createOrGetPlayerWithUid(playerNickname.trim(), playerUid.trim());
    
      
      // Update state
      setLinkedPlayer(player);
      setSuccess("Player linked successfully!");
      
      // Clear inputs
      setPlayerUid("");
      setPlayerNickname("");
      
      // Load reviews for the newly linked player
      await loadReviews(player);
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
          Link your Telegram account to an in-game player by entering your UID and nickname. This will allow you to leave reviews and see your review history.
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
              {linkedPlayer.playerUid && (
                <Typography variant="body2" color="text.secondary">
                  UID: {linkedPlayer.playerUid}
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleLinkPlayer} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Player UID"
              value={playerUid}
              onChange={(e) => setPlayerUid(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              disabled={linking}
              placeholder="Enter your player UID"
            />
            <TextField
              label="Player Nickname"
              value={playerNickname}
              onChange={(e) => setPlayerNickname(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              disabled={linking}
              placeholder="Enter your player nickname"
            />
            <Button
              type="submit"
              variant="contained"
              disabled={linking || !playerNickname.trim()}
              startIcon={linking ? <CircularProgress size={20} /> : null}
              sx={{ alignSelf: "flex-start" }}
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
          
          {/* Tabbed interface for reviews */}
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="Reviews by You" sx={{ px: 4 }} />
            <Tab label="Reviews on You" sx={{ px: 4 }} />
          </Tabs>
          
          {/* Reviews by You Tab */}
          {activeTab === 0 && (
            <Box>
              {userReviews.items && userReviews.items.length > 0 ? (
                <Box sx={{ mb: 3 }}>
                  {userReviews.items?.map((review) => (
                    <Box key={review.id} sx={{ mb: 2 }}>
                      <ReviewItem review={{
                        ...review,
                        author: review.playerNick,
                        playerNick: review.playerNick,
                        createdAt: review.createdAt,
                        grade: review.grade,
                        rank: review.rank,
                        comment: review.comment,
                        screenshotUrl: review.screenshotUrl
                      }} />
                    </Box>
                  ))}
                  
                  {userReviews.totalElements > 0 && userReviews.items && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                      Showing {userReviews.items.length} of {userReviews.totalElements} reviews
                    </Typography>
                  )}
                  
                  <Pagination 
                    currentPage={userReviews.currentPage} 
                    totalPages={userReviews.totalPages} 
                    onPageChange={handleUserReviewsPageChange} 
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  You haven't left any reviews yet.
                </Typography>
              )}
            </Box>
          )}
          
          {/* Reviews on You Tab */}
          {activeTab === 1 && (
            <Box>
              {playerReviews.items && playerReviews.items.length > 0 ? (
                <Box sx={{ mb: 3 }}>
                  {playerReviews.items?.map((review) => (
                    <Box key={review.id} sx={{ mb: 2 }}>
                      <ReviewItem review={review} />
                    </Box>
                  ))}
                  
                  {playerReviews.totalElements > 0 && playerReviews.items && (
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
          )}
        </Paper>
      )}
    </Box>
  );
}