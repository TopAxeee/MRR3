// src/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7F5BFF', // Purple from the new design
      light: '#9A7DFF',
      dark: '#6642E0',
    },
    secondary: {
      main: '#0FD0FF', // Blue from the new design
      light: '#3FD9FF',
      dark: '#00B8E6',
    },
    background: {
      default: '#16181D', // Background color from the new design
      paper: '#15171C', // Card background from the new design
    },
    text: {
      primary: '#E4E6EB', // Primary text color from the new design
      secondary: '#A8ABB2', // Secondary text color from the new design
    },
    // Adding custom colors for the new design
    custom: {
      cardBackground: '#15171C',
      inputBackground: '#1A1C21',
      inputBorder: '#30333B',
      buttonSecondary: '#1F2127',
      tabInactive: '#A8ABB2',
      success: '#03C988',
      error: '#FF0046',
      info: '#00CCFF',
    }
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: '#15171C', // Card background from the new design
          border: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #7F5BFF, #0FD0FF)', // Header gradient from the new design
          boxShadow: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 'bold',
          padding: '12px 20px',
        },
        contained: {
          background: 'linear-gradient(90deg, #7F5BFF, #0FD0FF)', // Primary button gradient
          color: 'white',
          boxShadow: 'none',
          '&:hover': {
            background: 'linear-gradient(90deg, #6642E0, #00B8E6)',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: 'rgba(127, 91, 255, 0.4)',
          color: '#E4E6EB',
          background: '#1F2127', // Secondary button background
          '&:hover': {
            borderColor: 'rgba(127, 91, 255, 0.6)',
            background: '#2A2D33',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: '#1A1C21', // Input background from the new design
            borderRadius: 10,
            color: '#E4E6EB',
            '& fieldset': {
              borderColor: '#30333B', // Input border from the new design
            },
            '&:hover fieldset': {
              borderColor: '#7F5BFF',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7F5BFF',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#A8ABB2',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#7F5BFF',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#A8ABB2', // Inactive tab color
          padding: '10px 0',
          minHeight: 'auto',
          '&.Mui-selected': {
            color: '#fff',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: 'linear-gradient(90deg, #7F5BFF, #0FD0FF)', // Active tab indicator
          height: 3,
        },
      },
    },
  },
});