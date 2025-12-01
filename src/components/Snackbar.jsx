// src/components/Snackbar.jsx
import React from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

export default function CustomSnackbar({ open, onClose, message, severity = "info" }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}