import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // palette values for light mode
          primary: {
            main: '#4338ca', // Deep Indigo
            light: '#6366f1',
            dark: '#312e81',
          },
          secondary: {
            main: '#059669', // Emerald Green
            light: '#10b981',
            dark: '#047857',
          },
          background: {
            default: '#f8fafc', // Soft Off-White
            paper: '#ffffff',
          },
          text: {
            primary: '#0f172a',
            secondary: '#475569',
          },
        }
      : {
          // palette values for dark mode
          primary: {
            main: '#6366f1', // Electric Blue/Indigo
            light: '#818cf8',
            dark: '#4338ca',
          },
          secondary: {
            main: '#10b981', // Neon Emerald
            light: '#34d399',
            dark: '#059669',
          },
          background: {
            default: '#0f172a', // Deep Navy
            paper: '#1e293b', // Slightly lighter navy for cards
          },
          text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
          },
        }),
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    success: { main: '#10b981' },
    info: { main: '#3b82f6' },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          padding: '10px 24px',
          boxShadow: 'none',
          fontWeight: 700,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        },
        containedPrimary: {
          backgroundColor: mode === 'light' ? '#000000' : '#ffffff',
          color: mode === 'light' ? '#ffffff' : '#000000',
          '&:hover': {
            backgroundColor: mode === 'light' ? '#222222' : '#f1f5f9',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
          }
        },
        outlinedPrimary: {
          borderColor: mode === 'light' ? '#000000' : '#ffffff',
          color: mode === 'light' ? '#000000' : '#ffffff',
          '&:hover': {
            borderColor: mode === 'light' ? '#222222' : '#f1f5f9',
            backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)',
          }
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #1e293b',
          boxShadow: mode === 'light'
            ? '0 6px 20px rgba(0, 0, 0, 0.02)'
            : '0 6px 20px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease-in-out',
          backgroundImage: 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light'
              ? '0 12px 24px rgba(0, 0, 0, 0.04)'
              : '0 12px 24px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px',
            transition: 'all 0.2s ease-in-out',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#000000' : '#ffffff',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderBottom: mode === 'light' ? '1px solid #e2e8f0' : '1px solid #334155',
        },
        head: {
          fontWeight: 600,
          color: mode === 'light' ? '#475569' : '#94a3b8',
          backgroundColor: mode === 'light' ? '#f8fafc' : '#1e293b',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: mode === 'light' ? '#f1f5f9 !important' : '#334155 !important',
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
          },
        },
      },
    },
  },
});

export const getTheme = (mode) => createTheme(getDesignTokens(mode));
