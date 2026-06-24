import React, { createContext, useContext, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogActions, Button, Zoom, Box, Typography, TextField } from '@mui/material';
import { AlertTriangle, HelpCircle, Info } from 'lucide-react';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [promptValue, setPromptValue] = useState('');
  const [options, setOptions] = useState({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'OK',
    cancelText: 'Cancel',
    severity: 'warning', // 'info' | 'warning' | 'error' | 'success'
    isAlert: false,
    isPrompt: false,
    promptPlaceholder: ''
  });

  const resolverRef = useRef(null);

  const confirm = (customOptions = {}) => {
    setPromptValue('');
    setOptions({
      title: customOptions.title || 'Confirm Action',
      message: customOptions.message || 'Are you sure you want to proceed?',
      confirmText: customOptions.confirmText || 'OK',
      cancelText: customOptions.cancelText || 'Cancel',
      severity: customOptions.severity || 'warning',
      isAlert: !!customOptions.isAlert,
      isPrompt: !!customOptions.isPrompt,
      promptPlaceholder: customOptions.promptPlaceholder || ''
    });
    setOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleClose = (value) => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(value);
      resolverRef.current = null;
    }
  };

  const handleConfirm = () => {
    setOpen(false);
    if (resolverRef.current) {
      if (options.isPrompt) {
        resolverRef.current(promptValue);
      } else {
        resolverRef.current(true);
      }
      resolverRef.current = null;
    }
  };

  const getSeverityIcon = (sev) => {
    switch (sev) {
      case 'error':
        return <AlertTriangle size={32} color="#f43f5e" />;
      case 'success':
        return <HelpCircle size={32} color="#10b981" />;
      case 'info':
        return <Info size={32} color="#3b82f6" />;
      case 'warning':
      default:
        return <AlertTriangle size={32} color="#f59e0b" />;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog
        open={open}
        onClose={() => handleClose(null)}
        TransitionComponent={Zoom}
        TransitionProps={{ timeout: 250 }}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: 1.5,
            maxWidth: 420,
            width: '90%',
            backgroundColor: theme => theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(24, 24, 35, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid',
            borderColor: theme => theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
            boxShadow: theme => theme.palette.mode === 'light'
              ? '0 20px 45px rgba(0,0,0,0.08)'
              : '0 20px 45px rgba(0,0,0,0.4)',
            backgroundImage: 'none'
          }
        }}
      >
        <DialogContent sx={{ pb: 1, pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: theme => {
                const colors = {
                  error: 'rgba(244, 63, 94, 0.1)',
                  warning: 'rgba(245, 158, 11, 0.1)',
                  info: 'rgba(59, 130, 246, 0.1)',
                  success: 'rgba(16, 185, 129, 0.1)'
                };
                return colors[options.severity] || colors.warning;
              }
            }}>
              {getSeverityIcon(options.severity)}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Outfit', 'Inter', sans-serif" }}>
              {options.title}
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
              {options.message}
            </Typography>
            {options.isPrompt && (
              <TextField
                fullWidth
                size="small"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                placeholder={options.promptPlaceholder}
                autoFocus
                sx={{ mt: 1.5 }}
                inputProps={{
                  style: { textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif" }
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, display: 'flex', gap: 1.5 }}>
          {!options.isAlert && (
            <Button
              fullWidth
              onClick={() => handleClose(null)}
              variant="outlined"
              sx={{
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                fontFamily: "'Outfit', sans-serif",
                py: 1,
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'text.primary',
                  backgroundColor: 'transparent'
                }
              }}
            >
              {options.cancelText}
            </Button>
          )}
          <Button
            fullWidth
            onClick={handleConfirm}
            variant="contained"
            color={options.severity === 'error' ? 'error' : 'primary'}
            sx={{
              borderRadius: '14px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              fontFamily: "'Outfit', sans-serif",
              py: 1,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none'
              }
            }}
          >
            {options.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
};
