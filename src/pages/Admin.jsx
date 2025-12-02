// src/pages/Admin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { 
  listRecentPlayers, 
  fetchReviewsByPlayer,
  deletePlayerByNick,
  deleteReviewById,
  getAdminReviews,
  updatePlayerNick,
  isAuthenticated,
  checkAdminAccess,
  fetchReviewsByUserId
} from "../services/api";
import Pagination from "../components/Pagination";

// Material UI Components
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  OutlinedInput
} from "@mui/material";

// Material UI Icons
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export default function Admin() {
  const [tabValue, setTabValue] = useState(0);
  const [players, setPlayers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [playerNickSearch, setPlayerNickSearch] = useState(''); // For reviews search
  const [ownerNameSearch, setOwnerNameSearch] = useState(''); // For reviews search
  const [editNickName, setEditNickName] = useState('');
  const [detailView, setDetailView] = useState(null); // For player/user detail view
  const [detailReviews, setDetailReviews] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPagination, setDetailPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    limit: 10
  }); // For pagination in detail views
  const [reviewsPagination, setReviewsPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    limit: 20
  });
  const [playersPagination, setPlayersPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    limit: 20
  });
  const navigate = useNavigate();

  // Check if user has admin access
  useEffect(() => {
    const checkAccess = async () => {
      setAccessLoading(true);
      try {
        // Redirect to home if user is not authenticated
        if (!isAuthenticated()) {
          navigate("/");
          return;
        }
        
        const access = await checkAdminAccess();
        setHasAccess(access);
        
        if (!access) {
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        navigate("/");
      } finally {
        setAccessLoading(false);
      }
    };
    
    checkAccess();
  }, [navigate]);

  // Set document title when component mounts
  useEffect(() => {
    document.title = "admin Marvel Rivals reviews";
  }, []);

  // Function to handle clicking on player row
  const handlePlayerRowClick = (player) => {
    navigate(`/player/${player.nickName}`);
  };

  // Function to handle edit action
  const handleEditPlayer = (player) => {
    setSelectedItem(player);
    setEditNickName(player.nickName);
    setOpenEditDialog(true);
  };

  // Function to handle save edit
  const handleEditSave = async () => {
    try {
      // Validate input
      if (!editNickName || editNickName.trim() === '') {
        showSnackbar('Nickname cannot be empty', 'error');
        return;
      }
      
      if (selectedItem && editNickName && editNickName !== selectedItem.nickName) {
        await updatePlayerNick(selectedItem.nickName, editNickName);
        showSnackbar(`Player nickname updated successfully`, 'success');
        setOpenEditDialog(false);
        setSelectedItem(null);
        setEditNickName('');
        // Reload data
        loadData();
      } else {
        setOpenEditDialog(false);
        setSelectedItem(null);
        setEditNickName('');
      }
    } catch (error) {
      console.error('Error updating player:', error);
      // Handle specific error cases
      if (error.message === "PLAYER_NOT_FOUND") {
        showSnackbar('Player not found. The player may have been deleted.', 'error');
      } else if (error.message === "PLAYER_ALREADY_EXISTS") {
        showSnackbar('A player with this nickname already exists. Please choose a different nickname.', 'error');
      } else {
        showSnackbar('Error updating player', 'error');
      }
    }
  };

  // Load data based on active tab
  useEffect(() => {
    // Double-check admin access
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    
    // If we're not in detail view, load main data
    if (!detailView) {
      loadData();
    }
  }, [tabValue, detailView]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (tabValue) {
        case 0: // Players
          // Use pagination for players
          const playerData = await listRecentPlayers(20, 0);
          // Handle paginated response properly
          if (playerData && typeof playerData === 'object' && 'content' in playerData) {
            // Paginated response format
            setPlayers(playerData.content || []);
            setPlayersPagination({
              currentPage: playerData.page || 0,
              totalPages: playerData.totalPages || 1,
              totalElements: playerData.totalElements || playerData.content?.length || 0,
              limit: playerData.limit || 20
            });
          } else {
            // Non-paginated response (array)
            const playersArray = Array.isArray(playerData) ? playerData : [];
            setPlayers(playersArray);
            setPlayersPagination({
              currentPage: 0,
              totalPages: 1,
              totalElements: playersArray.length,
              limit: 20
            });
          }
          break;
        case 1: // Reviews
          // Use the admin endpoint to get reviews with pagination
          const reviewsData = await getAdminReviews(playerNickSearch, ownerNameSearch, 0, 20);
          setReviews(reviewsData.items);
          setReviewsPagination({
            currentPage: reviewsData.currentPage,
            totalPages: reviewsData.totalPages,
            totalElements: reviewsData.totalElements,
            limit: reviewsData.limit
          });
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle players pagination
  const handlePlayersPageChange = async (newPage) => {
    setLoading(true);
    try {
      const playerData = await listRecentPlayers(20, newPage);
      // Handle paginated response properly
      if (playerData && typeof playerData === 'object' && 'content' in playerData) {
        // Paginated response format
        setPlayers(playerData.content || []);
        setPlayersPagination({
          currentPage: playerData.page || newPage,
          totalPages: playerData.totalPages || 1,
          totalElements: playerData.totalElements || playerData.content?.length || 0,
          limit: playerData.limit || 20
        });
      } else {
        // Non-paginated response (array)
        const playersArray = Array.isArray(playerData) ? playerData : [];
        setPlayers(playersArray);
        setPlayersPagination({
          currentPage: newPage,
          totalPages: newPage + 1,
          totalElements: playersArray.length,
          limit: 20
        });
      }
    } catch (error) {
      console.error('Error loading players:', error);
      showSnackbar('Error loading players', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle reviews pagination
  const handleReviewsPageChange = async (newPage) => {
    setLoading(true);
    try {
      const reviewsData = await getAdminReviews(playerNickSearch, ownerNameSearch, newPage, 20);
      setReviews(reviewsData.items);
      setReviewsPagination({
        currentPage: reviewsData.currentPage,
        totalPages: reviewsData.totalPages,
        totalElements: reviewsData.totalElements,
        limit: reviewsData.limit
      });
    } catch (error) {
      showSnackbar('Error loading reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle search
  const handleSearch = async () => {
    if (tabValue === 1) {
      setLoading(true);
      try {
        const reviewsData = await getAdminReviews(playerNickSearch, ownerNameSearch, 0, 20);
        setReviews(reviewsData.items);
        setReviewsPagination({
          currentPage: reviewsData.currentPage,
          totalPages: reviewsData.totalPages,
          totalElements: reviewsData.totalElements,
          limit: reviewsData.limit
        });
      } catch (error) {
        showSnackbar('Error searching reviews', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      // For players tab, the filtering is done client-side
      // The useEffect will automatically filter the players
    }
  };

  // Function to reset search
  const handleResetSearch = () => {
    if (tabValue === 0) {
      setSearchQuery('');
    } else {
      setPlayerNickSearch('');
      setOwnerNameSearch('');
      // Reload all reviews
      loadData();
    }
  };

  // Function to view reviews for a specific player
  const handleViewPlayerReviews = async (player, page = 0) => {
    setDetailLoading(true);
    setDetailView({ type: 'player', data: player });
    try {
      const playerReviews = await fetchReviewsByPlayer(player.nickName, 30, page, 10);
      setDetailReviews(playerReviews.items || playerReviews);
      setDetailPagination({
        currentPage: playerReviews.currentPage,
        totalPages: playerReviews.totalPages,
        totalElements: playerReviews.totalElements,
        limit: playerReviews.limit
      });
    } catch (error) {
      console.error('Error fetching player reviews:', error);
      showSnackbar('Error loading player reviews', 'error');
      setDetailReviews([]);
      setDetailPagination({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        limit: 10
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Function to view reviews by a specific user
  const handleViewUserReviews = async (review, page = 0) => {
    setDetailLoading(true);
    setDetailView({ 
      type: 'user', 
      data: review.owner,
      playerName: review.playerNick
    });
    try {
      const userReviews = await fetchReviewsByUserId(review.owner.id, page, 10);
      setDetailReviews(userReviews.items || userReviews);
      setDetailPagination({
        currentPage: userReviews.currentPage,
        totalPages: userReviews.totalPages,
        totalElements: userReviews.totalElements,
        limit: userReviews.limit
      });
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      showSnackbar('Error loading user reviews', 'error');
      setDetailReviews([]);
      setDetailPagination({
        currentPage: 0,
        totalPages: 0,
        totalElements: 0,
        limit: 10
      });
    } finally {
      setDetailLoading(false);
    }
  };

  // Function to go back to main view
  const handleBackToMain = () => {
    setDetailView(null);
    setDetailReviews([]);
    setDetailPagination({
      currentPage: 0,
      totalPages: 0,
      totalElements: 0,
      limit: 10
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset detail view when changing tabs
    setDetailView(null);
    setDetailReviews([]);
    // Reset search fields when changing tabs
    setSearchQuery('');
    setPlayerNickSearch('');
    setOwnerNameSearch('');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (selectedItem && selectedItem.nickName) {
        // Delete player
        await deletePlayerByNick(selectedItem.nickName);
        showSnackbar(`Player ${selectedItem.nickName} deleted successfully`, 'success');
        // Reload data
        loadData();
      } else if (selectedItem && selectedItem.id) {
        // Delete review
        await deleteReviewById(selectedItem.id);
        showSnackbar(`Review deleted successfully`, 'success');
        // Reload data
        loadData();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      // Handle specific error cases
      if (error.message === "PLAYER_NOT_FOUND") {
        showSnackbar('Player not found. The player may have already been deleted.', 'error');
      } else if (error.message === "REVIEW_NOT_FOUND") {
        showSnackbar('Review not found. The review may have already been deleted.', 'error');
      } else {
        showSnackbar('Error deleting item', 'error');
      }
    } finally {
      setOpenDeleteDialog(false);
      setSelectedItem(null);
      // If we're in detail view, reload the detail reviews
      if (detailView) {
        if (detailView.type === 'player') {
          handleViewPlayerReviews(detailView.data);
        } else if (detailView.type === 'user') {
          handleViewUserReviews({ owner: detailView.data, playerNick: detailView.playerName });
        }
      }
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setSelectedItem(null);
  };

  const handleEditCancel = () => {
    setOpenEditDialog(false);
    setSelectedItem(null);
    setEditNickName('');
  };

  const filteredPlayers = players.filter(player => 
    player.nickName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to handle pagination changes in detail view
  const handleDetailPageChange = async (newPage) => {
    if (!detailView) return;
    
    setDetailLoading(true);
    try {
      if (detailView.type === 'player') {
        const playerReviews = await fetchReviewsByPlayer(detailView.data.nickName, 30, newPage, 10);
        setDetailReviews(playerReviews.items || playerReviews);
        setDetailPagination({
          currentPage: playerReviews.currentPage,
          totalPages: playerReviews.totalPages,
          totalElements: playerReviews.totalElements,
          limit: playerReviews.limit
        });
      } else if (detailView.type === 'user') {
        const userReviews = await fetchReviewsByUserId(detailView.data.id, newPage, 10);
        setDetailReviews(userReviews.items || userReviews);
        setDetailPagination({
          currentPage: userReviews.currentPage,
          totalPages: userReviews.totalPages,
          totalElements: userReviews.totalElements,
          limit: userReviews.limit
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showSnackbar('Error loading reviews', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  // Show loading state while checking access
  if (accessLoading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Checking Access...
        </Typography>
        <Typography variant="body1">
          Please wait while we verify your admin permissions.
        </Typography>
      </Box>
    );
  }

  // Check if user has admin access, if not show access denied message
  if (!hasAccess) {
    return (
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Access Denied
        </Typography>
        <Typography variant="body1">
          You do not have permission to access the admin panel.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate("/")}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Box>
    );
  }

  // If we're in detail view, show the detail component
  if (detailView) {
    return (
      <Box>
        <Button 
          onClick={handleBackToMain}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          ← Back to Admin Panel
        </Button>
        
        <Typography variant="h4" sx={{ mb: 3 }}>
          {detailView.type === 'player' ? `Reviews for Player: ${detailView.data.nickName}` : `Reviews by User: ${detailView.data.userName || detailView.data.firstName || 'Unknown User'}`}
        </Typography>
        
        {detailLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper sx={{ mb: 3, p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Review Details
              </Typography>
              <Typography>
                Total Reviews: {detailPagination.totalElements}
              </Typography>
            </Paper>
            
            {detailReviews.length > 0 ? (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{detailView.type === 'player' ? 'Reviewer' : 'Player'}</TableCell>
                        <TableCell>Comment</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Rank</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailReviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell>
                            {detailView.type === 'player' ? 
                              (review.userNick || 'Anonymous') : 
                              (review.playerNick || 'Unknown Player')
                            }
                          </TableCell>
                          <TableCell>{review.comment}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${review.grade}/5`} 
                              color={review.grade >= 4 ? "success" : review.grade >= 3 ? "warning" : "error"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{review.rank || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              onClick={() => handleDeleteClick(review)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {detailPagination.totalPages > 1 && (
                  <Pagination 
                    currentPage={detailPagination.currentPage} 
                    totalPages={detailPagination.totalPages} 
                    onPageChange={handleDetailPageChange} 
                  />
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                </Box>
              </>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography>No reviews found.</Typography>
              </Paper>
            )}
          </>
        )}
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={handleDeleteCancel}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
        >
          <DialogTitle id="delete-dialog-title">
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-description">
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Admin Panel
      </Typography>
      
      <Paper sx={{ mb: 3, p: 2 }}>
        {tabValue === 0 ? (
          <TextField
            fullWidth
            label="Search players by nickname"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        ) : (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Player Nickname"
              value={playerNickSearch}
              onChange={(e) => setPlayerNickSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <TextField
              label="Owner Name"
              value={ownerNameSearch}
              onChange={(e) => setOwnerNameSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Box>
        )}
        <Box sx={{ mt: 1 }}>
          <Button 
            variant="contained" 
            onClick={handleSearch}
            sx={{ mr: 1 }}
          >
            Search
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleResetSearch}
          >
            Reset
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Players" />
          <Tab label="Reviews" />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {tabValue === 0 && (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nickname</TableCell>
                      <TableCell>Avg Grade</TableCell>
                      <TableCell>Avg Rank</TableCell>
                      <TableCell>Reviews Count</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPlayers.map((player) => (
                      <TableRow 
                        key={player.id}
                        sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer' } }}
                        onClick={() => handlePlayerRowClick(player)}
                      >
                        <TableCell component="th" scope="row">
                          {player.nickName}
                        </TableCell>
                        <TableCell>
                          {player.avgGrade !== undefined && player.avgGrade !== null ? 
                            player.avgGrade.toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {player.avgRank !== undefined && player.avgRank !== null ? 
                            player.avgRank.toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell>{player.reviewsCount || 0}</TableCell>
                        <TableCell>
                          <Button 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewPlayerReviews(player);
                            }}
                            sx={{ mr: 1 }}
                          >
                            View Reviews
                          </Button>
                          <IconButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPlayer(player);
                            }}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(player);
                            }}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {playersPagination.totalPages > 1 && (
                <Pagination 
                  currentPage={playersPagination.currentPage} 
                  totalPages={playersPagination.totalPages} 
                  onPageChange={handlePlayersPageChange} 
                />
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Typography variant="body2">
                  Showing {filteredPlayers.length} of {playersPagination.totalElements} players
                </Typography>
              </Box>
            </>
          )}
          
          {tabValue === 1 && (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Player</TableCell>
                      <TableCell>Comment</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>{review.playerNick}</TableCell>
                        <TableCell>{review.comment}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${review.grade}/5`} 
                            color={review.grade >= 4 ? "success" : review.grade >= 3 ? "warning" : "error"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small"
                            onClick={() => handleViewUserReviews(review)}
                          >
                            {review.userNick}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={() => handleDeleteClick(review)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {reviewsPagination.totalPages > 1 && (
                <Pagination 
                  currentPage={reviewsPagination.currentPage} 
                  totalPages={reviewsPagination.totalPages} 
                  onPageChange={handleReviewsPageChange} 
                />
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              </Box>
            </>
          )}
        </>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Player Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleEditCancel}
        aria-labelledby="edit-dialog-title"
      >
        <DialogTitle id="edit-dialog-title">
          Edit Player
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel htmlFor="player-nickname">Nickname</InputLabel>
            <OutlinedInput
              id="player-nickname"
              value={editNickName}
              onChange={(e) => setEditNickName(e.target.value)}
              label="Nickname"
            />
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button onClick={handleEditSave} color="primary" autoFocus>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}