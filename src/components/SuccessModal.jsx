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
          borderRadius: 12,
          textAlign: "center",
          background: "#15171C", // Card background from new design
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon 
            sx={{ 
              fontSize: 48, 
              color: "#03C988", // Success color from new design
              mb: 1
            }} 
          />
          <Typography variant="h5" component="div" sx={{ color: "#E4E6EB" }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ color: "#A8ABB2" }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          size="large"
          sx={{ 
            minWidth: 120,
            background: "linear-gradient(90deg, #7F5BFF, #0FD0FF)",
            color: "white",
            fontWeight: "bold",
            borderRadius: 12,
            padding: "12px 20px",
            boxShadow: "none",
            "&:hover": {
              background: "linear-gradient(90deg, #6642E0, #00B8E6)",
              boxShadow: "none",
            }
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}