import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, InputAdornment, IconButton, CircularProgress, useTheme, Avatar, Collapse, Divider, Chip, Grid, useMediaQuery } from '@mui/material';
import { Eye, EyeOff, Settings, Calendar, Wallet, Users, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
import { keyframes } from '@mui/system';
import api from '../api/axiosConfig';
import { useThemeStore } from '../store';
import cuteAvatar from '../assets/cute_person_avatar.png';

// Cute floating and slight rotating animation for the avatar
const floatCute = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

// Safe spin animation using keyframes helper
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SettingsPage = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { mode, setMode } = useThemeStore();
  
  // Detect if screen is desktop (medium screen size and up)
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  // Profile states
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');

  // UI States (Mobile only)
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileError('');
        const response = await api.get('/auth/profile');
        setProfile(response.data);
      } catch (err) {
        console.error('Failed to fetch profile details', err);
        setProfileError('Failed to load profile details. Please verify the backend is running and restarted.');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      setSuccess(response.data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-collapse form after success for polished UX (Mobile only)
      if (!isDesktop) {
        setTimeout(() => {
          setShowPasswordForm(false);
          setSuccess('');
        }, 3000);
      } else {
        // Just clear success message on desktop after a delay
        setTimeout(() => {
          setSuccess('');
        }, 4000);
      }
      
    } catch (err) {
      console.error('Failed to change password', err);
      setError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to render the sliding theme selector pill (shared between desktop & mobile layouts)
  const renderThemeSelector = () => (
    <Box 
      sx={{ 
        position: 'relative',
        width: '100%',
        height: 46,
        borderRadius: '23px',
        backgroundColor: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.04)',
        border: '1px solid',
        borderColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)',
        display: 'flex',
        p: 0.5,
        boxSizing: 'border-box',
      }}
    >
      {/* Sliding Background Bubble */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: mode === 'light' ? 4 : 'calc(50% + 2px)',
          width: 'calc(50% - 6px)',
          borderRadius: '19px',
          backgroundColor: isLight ? '#ffffff' : 'rgba(99, 102, 241, 0.2)',
          border: isLight ? '1px solid rgba(0, 0, 0, 0.04)' : '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: isLight ? '0 3px 8px rgba(0, 0, 0, 0.06)' : '0 3px 12px rgba(99, 102, 241, 0.15)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          zIndex: 1,
        }}
      />

      {/* Light Mode Button */}
      <Box 
        onClick={() => setMode('light')}
        sx={{ 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          cursor: 'pointer',
          zIndex: 2,
          color: mode === 'light' ? (isLight ? 'primary.main' : '#ffffff') : 'text.secondary',
          fontWeight: mode === 'light' ? 700 : 500,
          fontSize: '0.85rem',
          transition: 'color 0.2s ease',
          '&:hover': {
            color: 'text.primary',
          }
        }}
      >
        <Sun size={16} />
        <Typography variant="body2" sx={{ fontWeight: 'inherit', fontSize: 'inherit' }}>
          Light Mode
        </Typography>
      </Box>

      {/* Dark Mode Button */}
      <Box 
        onClick={() => setMode('dark')}
        sx={{ 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          cursor: 'pointer',
          zIndex: 2,
          color: mode === 'dark' ? (isLight ? 'primary.main' : '#ffffff') : 'text.secondary',
          fontWeight: mode === 'dark' ? 700 : 500,
          fontSize: '0.85rem',
          transition: 'color 0.2s ease',
          '&:hover': {
            color: 'text.primary',
          }
        }}
      >
        <Moon size={16} />
        <Typography variant="body2" sx={{ fontWeight: 'inherit', fontSize: 'inherit' }}>
          Dark Mode
        </Typography>
      </Box>
    </Box>
  );

  // Helper to render the change password text fields (shared between desktop & mobile)
  const renderPasswordFormFields = () => (
    <>
      <TextField
        fullWidth
        label="Current Password"
        type={showCurrent ? 'text' : 'password'}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        variant="outlined"
        size="small"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end" size="small">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      <TextField
        fullWidth
        label="New Password"
        type={showNew ? 'text' : 'password'}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        variant="outlined"
        size="small"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowNew(!showNew)} edge="end" size="small">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />

      <TextField
        fullWidth
        label="Confirm New Password"
        type={showConfirm ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        variant="outlined"
        size="small"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </>
  );

  // ----------------- DESKTOP WEBSITE UI -----------------
  if (isDesktop) {
    return (
      <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, letterSpacing: '-0.02em' }}>
            <Settings size={24} style={{ color: theme.palette.primary.main }} />
            Account Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage your profile, theme preferences, and security credentials
          </Typography>
        </Box>

        <Grid container spacing={4} alignItems="stretch">
          {/* Left Column: User Profile Card (Stretches to match combined right column height) */}
          <Grid item xs={12} md={4.8} sx={{ display: 'flex' }}>
            <Card 
              sx={{ 
                width: '100%',
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%)' 
                  : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                border: '1px solid',
                borderColor: isLight ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.15)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                boxShadow: isLight
                  ? '0 10px 30px -5px rgba(99, 102, 241, 0.05)'
                  : '0 15px 35px -5px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%'
              }}
            >
              {/* Cute background aura */}
              <Box sx={{
                position: 'absolute',
                width: 150,
                height: 150,
                borderRadius: '50%',
                top: '-10%',
                right: '-10%',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)',
                filter: 'blur(20px)',
                zIndex: 0
              }} />

              <CardContent sx={{ p: 4, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', height: '100%', gap: 3.5, flexGrow: 1 }}>
                {loadingProfile ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
                    <CircularProgress size={35} />
                    <Typography variant="caption" color="text.secondary">Loading profile...</Typography>
                  </Box>
                ) : profileError ? (
                  <Alert severity="error" sx={{ borderRadius: 2, width: '100%' }}>{profileError}</Alert>
                ) : (
                  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around', height: '100%', gap: 4 }}>
                    
                    {/* Top Group: Avatar and Username */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2.5 }}>
                      {/* Cute Person Animated Avatar */}
                      <Box 
                        sx={{ 
                          position: 'relative',
                          animation: `${floatCute} 4s infinite ease-in-out`,
                          display: 'inline-block'
                        }}
                      >
                        <Box sx={{
                          position: 'absolute',
                          inset: -6,
                          borderRadius: '50%',
                          border: '2px dashed',
                          borderColor: 'primary.light',
                          opacity: 0.5,
                          animation: `${spin} 12s linear infinite`
                        }} />
                        <Avatar 
                          src={cuteAvatar} 
                          alt="Cute avatar" 
                          sx={{ 
                            width: 100, 
                            height: 100, 
                            border: '4px solid #ffffff', 
                            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
                            backgroundColor: '#eef2ff'
                          }}
                        />
                      </Box>

                      <Box sx={{ textAlign: 'center' }}>
                        <Chip
                          icon={<Users size={12} />}
                          label={profile?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Tenant User'}
                          size="small"
                          color="primary"
                          sx={{ 
                            fontWeight: 700, 
                            fontSize: '0.7rem', 
                            mb: 1,
                            backgroundColor: isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)',
                            color: isLight ? 'primary.main' : 'primary.light',
                            border: '1px solid',
                            borderColor: 'primary.light',
                            '& .MuiChip-icon': { color: 'inherit' }
                          }}
                        />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
                          {profile?.username}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Bottom Group: Profile Details Container */}
                    <Box 
                      sx={{ 
                        width: '100%', 
                        p: 3, 
                        borderRadius: 3, 
                        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.3)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid',
                        borderColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: isLight ? 'rgba(99, 102, 241, 0.06)' : 'rgba(99, 102, 241, 0.12)' }}>
                          <Wallet size={18} style={{ color: theme.palette.primary.main }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Tenant ID</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>{profile?.tenantId || 'N/A'}</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: isLight ? 'rgba(168, 85, 247, 0.06)' : 'rgba(168, 85, 247, 0.12)' }}>
                          <Calendar size={18} style={{ color: theme.palette.secondary.main }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>Created At</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>{formatDate(profile?.createdAt)}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Theme Preference (top) & Change Password (bottom) */}
          <Grid item xs={12} md={7.2} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Theme Card */}
            <Card 
              sx={{ 
                width: '100%',
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%)' 
                  : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                border: '1px solid',
                borderColor: isLight ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.15)',
                borderRadius: 4,
                boxShadow: isLight
                  ? '0 10px 30px -5px rgba(99, 102, 241, 0.05)'
                  : '0 15px 35px -5px rgba(0, 0, 0, 0.2)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', letterSpacing: '-0.01em', textTransform: 'uppercase', fontSize: '0.75rem', opacity: 0.9 }}>
                  Theme Preference
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Select your preferred color theme for the management dashboard
                </Typography>
                <Box sx={{ maxWidth: 400 }}>
                  {renderThemeSelector()}
                </Box>
              </CardContent>
            </Card>

            {/* Password Card */}
            <Card 
              sx={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                flexGrow: 1,
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%)' 
                  : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                border: '1px solid',
                borderColor: isLight ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.15)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                boxShadow: isLight
                  ? '0 10px 30px -5px rgba(99, 102, 241, 0.05)'
                  : '0 15px 35px -5px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Complementary background aura */}
              <Box sx={{
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: '50%',
                bottom: '-12%',
                right: '-12%',
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%)',
                filter: 'blur(25px)',
                zIndex: 0
              }} />

              <CardContent sx={{ p: 4, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5, color: 'text.primary', letterSpacing: '-0.01em', textTransform: 'uppercase', fontSize: '0.75rem', opacity: 0.9 }}>
                    Change Password
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Update your security credentials. We recommend choosing a strong, unique password.
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {success && (
                    <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                      {success}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {renderPasswordFormFields()}
                  </Box>
                </Box>

                <Box sx={{ pt: 1 }}>
                  <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{ 
                      py: 1.4, 
                      fontWeight: 'bold',
                      borderRadius: 2.5,
                      alignSelf: 'flex-start',
                      px: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={18} color="inherit" />
                        Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // ----------------- MOBILE UI (100% Identical, Untouched) -----------------
  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', py: { xs: 1, sm: 3 } }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
          <Settings size={24} style={{ color: theme.palette.primary.main }} />
          Account Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your secure profile and update credentials
        </Typography>
      </Box>

      {/* Main Centered Cute Profile Card */}
      <Card 
        sx={{ 
          background: isLight 
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%)' 
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
          border: '1px solid',
          borderColor: isLight ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          boxShadow: isLight
            ? '0 10px 30px -5px rgba(99, 102, 241, 0.05), 0 5px 15px -5px rgba(0, 0, 0, 0.01)'
            : '0 15px 35px -5px rgba(0, 0, 0, 0.2), 0 5px 15px -5px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Cute background aura */}
        <Box sx={{
          position: 'absolute',
          width: 150,
          height: 150,
          borderRadius: '50%',
          top: '-10%',
          right: '-10%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)',
          filter: 'blur(20px)',
          zIndex: 0
        }} />

        <CardContent sx={{ p: { xs: 3, sm: 4 }, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {loadingProfile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
              <CircularProgress size={35} />
              <Typography variant="caption" color="text.secondary">Loading profile...</Typography>
            </Box>
          ) : profileError ? (
            <Alert severity="error" sx={{ borderRadius: 2, width: '100%' }}>{profileError}</Alert>
          ) : (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              
              {/* Cute Person Animated Avatar */}
              <Box 
                sx={{ 
                  position: 'relative',
                  animation: `${floatCute} 4s infinite ease-in-out`,
                  display: 'inline-block'
                }}
              >
                {/* Ring aura */}
                <Box sx={{
                  position: 'absolute',
                  inset: -6,
                  borderRadius: '50%',
                  border: '2px dashed',
                  borderColor: 'primary.light',
                  opacity: 0.5,
                  animation: `${spin} 12s linear infinite`
                }} />
                
                <Avatar 
                  src={cuteAvatar} 
                  alt="Cute avatar" 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    border: '4px solid #ffffff', 
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
                    backgroundColor: '#eef2ff'
                  }}
                />
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Chip
                  icon={<Users size={12} />}
                  label={profile?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Tenant User'}
                  size="small"
                  color="primary"
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: '0.7rem', 
                    mb: 1,
                    backgroundColor: isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)',
                    color: isLight ? 'primary.main' : 'primary.light',
                    border: '1px solid',
                    borderColor: 'primary.light',
                    '& .MuiChip-icon': { color: 'inherit' }
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', mb: 0.5 }}>
                  {profile?.username}
                </Typography>
              </Box>

              {/* Profile Details Container */}
              <Box 
                sx={{ 
                  width: '100%', 
                  p: 2, 
                  borderRadius: 3, 
                  backgroundColor: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.3)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid',
                  borderColor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Wallet size={16} style={{ color: theme.palette.primary.main, opacity: 0.8 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>Tenant ID</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{profile?.tenantId || 'N/A'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Calendar size={16} style={{ color: theme.palette.secondary.main, opacity: 0.8 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>Created At</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatDate(profile?.createdAt)}</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ width: '100%', my: 0.5 }} />

              {/* Theme Preference Section (Mobile) */}
              <Box sx={{ width: '100%', textAlign: 'left' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Theme Preference
                </Typography>
                {renderThemeSelector()}
              </Box>

              <Divider sx={{ width: '100%', my: 0.5 }} />

              {/* Action Button to Expand Password Drawer (Mobile) */}
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setError('');
                  setSuccess('');
                }}
                endIcon={showPasswordForm ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                sx={{
                  py: 1.2,
                  fontWeight: 'bold',
                  borderWidth: '1.5px',
                  borderRadius: 2.5,
                  '&:hover': { borderWidth: '1.5px' }
                }}
              >
                {showPasswordForm ? 'Close Security Form' : 'Change Password'}
              </Button>

              {/* Collapsible Password Form (Mobile) */}
              <Collapse in={showPasswordForm} timeout="auto" sx={{ width: '100%' }}>
                <Box 
                  component="form" 
                  onSubmit={handleSubmit} 
                  noValidate
                  sx={{ 
                    width: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2.5,
                    pt: 1,
                    pb: 1
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    Security Credentials
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {success && (
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                      {success}
                    </Alert>
                  )}

                  {renderPasswordFormFields()}

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    fullWidth
                    sx={{ 
                      py: 1.2, 
                      fontWeight: 'bold',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1
                    }}
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={18} color="inherit" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </Box>
              </Collapse>

            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SettingsPage;
