// src/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1e3a8a', // Темно-синий
      light: '#3b82f6',
      dark: '#1e40af',
    },
    secondary: {
      main: '#f97316', // Оранжевый
      light: '#fb923c',
      dark: '#ea580c',
    },
    background: {
      default: '#0f172a', // Очень темный синий
      paper: '#1e293b', // Темно-синий для карточек
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
          borderRadius: 16,
          background: 'linear-gradient(145deg, #1e293b 0%, #334155 100%)',
          border: '1px solid #334155',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #f97316 0%, #3b82f6 100%)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '3px solid #334155',
        },
      },
    },
  },
});