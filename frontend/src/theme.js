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
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '10px 24px',
          boxShadow: 'none',
          fontWeight: 700,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1.5px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        },
        containedPrimary: {
          backgroundColor: mode === 'light' ? '#4338ca' : '#6366f1',
          color: '#ffffff',
          boxShadow: mode === 'light'
            ? '0 4px 14px 0 rgba(67, 56, 202, 0.25)'
            : '0 4px 14px 0 rgba(99, 102, 241, 0.35)',
          '&:hover': {
            backgroundColor: mode === 'light' ? '#312e81' : '#818cf8',
            boxShadow: mode === 'light'
              ? '0 6px 20px 0 rgba(67, 56, 202, 0.35)'
              : '0 6px 20px 0 rgba(99, 102, 241, 0.45)',
          }
        },
        containedSecondary: {
          backgroundColor: mode === 'light' ? '#059669' : '#10b981',
          color: '#ffffff',
          boxShadow: mode === 'light'
            ? '0 4px 14px 0 rgba(5, 150, 105, 0.25)'
            : '0 4px 14px 0 rgba(16, 185, 129, 0.35)',
          '&:hover': {
            backgroundColor: mode === 'light' ? '#047857' : '#34d399',
            boxShadow: mode === 'light'
              ? '0 6px 20px 0 rgba(5, 150, 105, 0.35)'
              : '0 6px 20px 0 rgba(16, 185, 129, 0.45)',
          }
        },
        outlinedPrimary: {
          borderColor: mode === 'light' ? '#4338ca' : '#6366f1',
          color: mode === 'light' ? '#4338ca' : '#6366f1',
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            borderColor: mode === 'light' ? '#312e81' : '#818cf8',
            backgroundColor: mode === 'light' ? 'rgba(67, 56, 202, 0.04)' : 'rgba(99, 102, 241, 0.08)',
          }
        },
        outlinedSecondary: {
          borderColor: mode === 'light' ? '#059669' : '#10b981',
          color: mode === 'light' ? '#059669' : '#10b981',
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            borderColor: mode === 'light' ? '#047857' : '#34d399',
            backgroundColor: mode === 'light' ? 'rgba(5, 150, 105, 0.04)' : 'rgba(16, 185, 129, 0.08)',
          }
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: mode === 'light' ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(20px)',
          boxShadow: mode === 'light'
            ? '0 10px 30px -5px rgba(0, 0, 0, 0.03), 0 5px 15px -5px rgba(0, 0, 0, 0.01)'
            : '0 15px 35px -5px rgba(0, 0, 0, 0.25), 0 5px 15px -5px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundImage: 'none',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: mode === 'light'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.35), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            borderColor: mode === 'light' ? 'rgba(67, 56, 202, 0.25)' : 'rgba(99, 102, 241, 0.25)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: {
          borderRadius: '12px',
          borderColor: mode === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(255, 255, 255, 0.06)',
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e293b',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#4338ca' : '#6366f1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#4338ca' : '#6366f1',
              borderWidth: '2px',
              boxShadow: mode === 'light' ? '0 0 0 4px rgba(99, 102, 241, 0.12)' : '0 0 0 4px rgba(99, 102, 241, 0.25)',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
          borderBottom: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #1e293b',
          fontFamily: '"Outfit", "Inter", sans-serif',
        },
        head: {
          fontWeight: 700,
          fontSize: '0.82rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: mode === 'light' ? '#475569' : '#94a3b8',
          backgroundColor: mode === 'light' ? 'rgba(248, 250, 252, 0.8)' : 'rgba(15, 23, 42, 0.8)',
          borderBottom: mode === 'light' ? '2px solid #e2e8f0' : '2px solid #1e293b',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: mode === 'light' ? 'rgba(99, 102, 241, 0.02) !important' : 'rgba(99, 102, 241, 0.04) !important',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid',
          borderColor: mode === 'light' ? '#e2e8f0' : '#1e293b',
        },
        indicator: {
          height: '3px',
          borderRadius: '3px 3px 0 0',
          backgroundColor: mode === 'light' ? '#4338ca' : '#6366f1',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.92rem',
          minWidth: 100,
          padding: '12px 20px',
          color: mode === 'light' ? '#64748b' : '#94a3b8',
          transition: 'all 0.2s ease-in-out',
          '&.Mui-selected': {
            color: mode === 'light' ? '#4338ca' : '#6366f1',
            fontWeight: 700,
          },
          '&:hover': {
            color: mode === 'light' ? '#312e81' : '#cbd5e1',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          backgroundImage: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backgroundColor: mode === 'light' ? '#ffffff' : '#0f172a',
          border: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #1e293b',
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
