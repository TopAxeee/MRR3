// src/pages/Admin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";

import { 
  listRecentPlayers, 
  fetchReviewsByPlayer,
  deletePlayerByNick,
  deleteReviewById,
  getAdminReviews,
  updatePlayerNick
} from "../services/api";

export default function Admin() {
  const [tabValue, setTabValue] = useState(0);
  const [players, setPlayers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [editNickName, setEditNickName] = useState('');
  const navigate = useNavigate();

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
      showSnackbar('Error updating player', 'error');
    }
  };

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [tabValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (tabValue) {
        case 0: // Players
          const playerData = await listRecentPlayers(100);
          setPlayers(playerData);
          break;
        case 1: // Reviews
          // Use the admin endpoint to get reviews with optional filters
          const allReviews = await getAdminReviews(searchQuery, '');
          setReviews(allReviews);
          break;
        default:
          break;
      }
    } catch (error) {
      showSnackbar('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
      showSnackbar('Error deleting item', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setSelectedItem(null);
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

  const filteredReviews = reviews.filter(review => 
    review.playerNick.toLowerCase().includes(searchQuery.toLowerCase()) ||
    review.comment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Admin Panel
      </Typography>
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          label="Search players or reviews"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Paper>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Players" />
          <Tab label="Reviews" />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          {tabValue === 0 && (
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
          )}
          
          {tabValue === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell>Comment</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.playerNick}</TableCell>
                      <TableCell>{review.comment}</TableCell>
                      <TableCell>{review.grade}/5</TableCell>
                      <TableCell>{review.author}</TableCell>
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