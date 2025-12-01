// src/components/ErrorModal.jsx
import React from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ErrorIcon from "@mui/icons-material/Error";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #ff5252",
  boxShadow: 24,
  borderRadius: 12,
  p: 4,
  outline: "none",
};

export default function ErrorModal({ open, onClose, title, message }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="error-modal-title"
      aria-describedby="error-modal-description"
    >
      <Box sx={style}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <ErrorIcon sx={{ color: "#ff5252", fontSize: "2rem" }} />
          <Typography id="error-modal-title" variant="h6" component="h2" sx={{ color: "#ff5252" }}>
            {title}
          </Typography>
        </Box>
        <Typography id="error-modal-description" sx={{ mb: 3 }}>
          {message}
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            background: "linear-gradient(90deg, #ff5252, #b33939)",
            color: "white",
            fontWeight: "bold",
            borderRadius: 12,
            padding: "10px 20px",
            boxShadow: "none",
            "&:hover": {
              background: "linear-gradient(90deg, #e64a4a, #a03232)",
              boxShadow: "none",
            },
          }}
        >
          Close
        </Button>
      </Box>
    </Modal>
  );
}