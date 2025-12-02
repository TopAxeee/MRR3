// src/components/Footer.jsx
import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        bgcolor: "background.paper",
        py: 3,
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Semi-transparent background with site name */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/logo.png)', // Placeholder - replace with actual logo if available
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.1,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* Footer content */}
      <Box 
        sx={{ 
          position: 'relative', 
          zIndex: 2,
          textAlign: 'center',
          maxWidth: 'lg',
          mx: 'auto',
          px: 2
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Marvel Rivals Reviews - Community Platform
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
          This is placeholder information that will be replaced with actual content
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
          © {new Date().getFullYear()} Marvel Rivals Reviews. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}