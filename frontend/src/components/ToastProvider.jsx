import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

function SlideTransition(props) {
  return <Slide {...props} direction="left" />;
}

export const ToastProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info'); // 'success' | 'info' | 'warning' | 'error'

  const showToast = useCallback((msg, type = 'info') => {
    // Force reset if already open to re-trigger slide-in animation
    setOpen(false);
    
    // Brief delay to allow slide-out to start before sliding in the new toast
    setTimeout(() => {
      setMessage(msg);
      setSeverity(type);
      setOpen(true);
    }, 150);
  }, []);

  const handleClose = useCallback((event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  }, []);

  // Helper to get a cute emoji based on severity (rendered inline in the text)
  const getCuteEmoji = (sev) => {
    switch (sev) {
      case 'success':
        return '✨'; // Sparkles
      case 'error':
        return '🥺'; // Pleading cute face for errors
      case 'warning':
        return '🧸'; // Teddy Bear
      case 'info':
      default:
        return '💫'; // Dizzy Star
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={3500}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          top: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 2000
        }}
      >
        <Alert 
          onClose={handleClose} 
          severity={severity}
          icon={false} // Remove the separate left-side icon container as requested
          sx={{ 
            width: '100%', 
            minWidth: 280, 
            maxWidth: 420,
            borderRadius: '20px', // Bubbly round layout
            fontWeight: 700,
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontSize: '0.85rem',
            letterSpacing: '0.01em',
            py: 1.2,
            px: 2.5,
            
            // Soft fluffy candy shadow and colored glow
            boxShadow: theme => {
              const glowColor = {
                success: 'rgba(52, 211, 153, 0.25)',
                error: 'rgba(251, 113, 133, 0.25)',
                warning: 'rgba(251, 191, 36, 0.25)',
                info: 'rgba(96, 165, 250, 0.25)'
              }[severity];
              return theme.palette.mode === 'light' 
                ? `0 12px 28px rgba(0, 0, 0, 0.06), 0 8px 16px ${glowColor}`
                : `0 12px 36px rgba(0, 0, 0, 0.5), 0 8px 24px ${glowColor}`;
            },

            // Bouncy elastic transitions
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            '&:hover': {
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: theme => {
                const glowColor = {
                  success: 'rgba(52, 211, 153, 0.35)',
                  error: 'rgba(251, 113, 133, 0.35)',
                  warning: 'rgba(251, 191, 36, 0.35)',
                  info: 'rgba(96, 165, 250, 0.35)'
                }[severity];
                return theme.palette.mode === 'light'
                  ? `0 16px 32px rgba(0, 0, 0, 0.08), 0 12px 20px ${glowColor}`
                  : `0 18px 40px rgba(0, 0, 0, 0.6), 0 12px 28px ${glowColor}`;
              }
            },

            backdropFilter: 'blur(16px)',
            
            // Pastel candy color schemes
            backgroundColor: theme => {
              const isLight = theme.palette.mode === 'light';
              if (severity === 'success') return isLight ? 'rgba(240, 253, 244, 0.95)' : 'rgba(20, 50, 32, 0.85)';
              if (severity === 'error') return isLight ? 'rgba(255, 241, 242, 0.95)' : 'rgba(60, 20, 28, 0.85)';
              if (severity === 'warning') return isLight ? 'rgba(254, 252, 232, 0.95)' : 'rgba(55, 45, 15, 0.85)';
              return isLight ? 'rgba(239, 246, 255, 0.95)' : 'rgba(20, 35, 60, 0.85)';
            },

            color: theme => {
              const isLight = theme.palette.mode === 'light';
              if (severity === 'success') return isLight ? '#15803d' : '#a7f3d0';
              if (severity === 'error') return isLight ? '#be123c' : '#fecdd3';
              if (severity === 'warning') return isLight ? '#a16207' : '#fde68a';
              return isLight ? '#1d4ed8' : '#bfdbfe';
            },

            border: '2px solid',
            borderColor: theme => {
              const isLight = theme.palette.mode === 'light';
              if (severity === 'success') return isLight ? 'rgba(74, 222, 128, 0.4)' : 'rgba(52, 211, 153, 0.3)';
              if (severity === 'error') return isLight ? 'rgba(251, 113, 133, 0.4)' : 'rgba(251, 113, 133, 0.3)';
              if (severity === 'warning') return isLight ? 'rgba(253, 224, 71, 0.4)' : 'rgba(251, 191, 36, 0.3)';
              return isLight ? 'rgba(147, 197, 253, 0.4)' : 'rgba(96, 165, 250, 0.3)';
            },

            '& .MuiAlert-message': {
              padding: '0px',
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1
            },
            '& .MuiAlert-action': {
              color: 'inherit',
              padding: '0px',
              marginRight: '-4px',
              alignSelf: 'center'
            }
          }}
        >
          {getCuteEmoji(severity)} {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
