// src/components/SuccessModal.jsx
import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Box from "@mui/material/Box";

export default function SuccessModal({ open, onClose, title = "Success!", message = "Your review has been submitted successfully!" }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          textAlign: "center"
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon 
            sx={{ 
              fontSize: 48, 
              color: "success.main",
              mb: 1
            }} 
          />
          <Typography variant="h5" component="div">
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          size="large"
          sx={{ minWidth: 120 }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}