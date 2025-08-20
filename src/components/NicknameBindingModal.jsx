// src/components/NicknameBindingModal.jsx
import React, { useState } from 'react';
import { 
  Modal, Box, Typography, TextField, Button, CircularProgress, Link 
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { bindNickname } from '../services/userService';

const NicknameBindingModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      setError('Please enter your game nickname');
      return;
    }
    
    try {
      setLoading(true);
      await bindNickname(user.uid, nickname.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Binding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" gutterBottom>
          Link Your Game Nickname
        </Typography>
        
        <TextField
          label="Game Nickname"
          fullWidth
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
        />
        
        {error?.includes('taken') && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            This nickname is already linked. Please contact{' '}
            <Link href="https://t.me/topaxe" target="_blank">
              @TopAxe
            </Link>{' '}
            for assistance.
          </Typography>
        )}
        
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Confirm Link'}
        </Button>
      </Box>
    </Modal>
  );
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1
};

export default NicknameBindingModal;