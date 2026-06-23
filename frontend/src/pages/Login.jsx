import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../api/axiosConfig';
import { ChevronLeft, Shield, Wallet, Users } from 'lucide-react';
import { keyframes } from '@mui/system';

// Import custom generated avatars
import avatar1 from '../assets/avatar1.png';
import avatar2 from '../assets/avatar2.png';

// Slide/fade animation for view switching
const slideIn = keyframes`
  from { opacity: 0; transform: translateX(25px); }
  to { opacity: 1; transform: translateX(0); }
`;

// Gentle floating animation for avatars and mockup widgets
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const floatSlow = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const floatFast = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(8px) rotate(-1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

// Shifting mesh gradient backgrounds
const drift1 = keyframes`
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(40px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
  100% { transform: translate(0px, 0px) scale(1); }
`;

const drift2 = keyframes`
  0% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(-50px, 60px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
`;

const drift3 = keyframes`
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(-30px, -30px) scale(1.05); }
  66% { transform: translate(50px, 40px) scale(0.85); }
  100% { transform: translate(0px, 0px) scale(1); }
`;

const pulseOutline = keyframes`
  0% { transform: scale(0.95); opacity: 0.8; }
  55% { transform: scale(1.15); opacity: 0; }
  100% { transform: scale(0.95); opacity: 0; }
`;

const Login = ({ initialFlow }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // flow states: 'welcome' | 'signin' | 'signup'
  const [flow, setFlow] = useState('welcome');

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  
  // Detect if screen width is mobile/tablet (less than md size)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Sync flow view on load and changes
  useEffect(() => {
    if (initialFlow === 'signup') {
      setFlow('signup');
    } else if (initialFlow === 'signin') {
      if (!isMobile) {
        setFlow('signin');
      } else if (flow === 'signup') {
        setFlow('signin');
      }
    }
  }, [initialFlow, isMobile]);

  // Sync flow view if transitioning to desktop so they don't get stuck on welcome screen
  useEffect(() => {
    if (!isMobile && flow === 'welcome') {
      setFlow('signin');
    }
  }, [isMobile, flow]);

  const handleSwitchToSignUp = () => {
    setFlow('signup');
    navigate('/signup');
    setError('');
    setSuccess('');
    reset();
  };

  const handleSwitchToSignIn = () => {
    setFlow('signin');
    navigate('/login');
    setError('');
    setSuccess('');
    reset();
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      if (flow === 'signup') {
        const response = await api.post('/auth/register', data);
        setSuccess(`Tenant registered! Generated Tenant ID: ${response.data.tenantId}. Please sign in.`);
        handleSwitchToSignIn();
      } else {
        const response = await api.post('/auth/login', data);
        const { token, id, username, role } = response.data;
        login({ id, username, role }, token);
        navigate('/');
      }
    } catch (err) {
      if (flow === 'signup') {
        setError(err.response?.data?.message || 'Registration failed. Username may be taken.');
      } else {
        setError('Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  };

  // Shared form rendering logic (used in both mobile layout and desktop split layout)
  const renderFormContent = () => (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
      
      {/* WELCOME VIEW (Mobile only) */}
      {flow === 'welcome' && isMobile && (
        <Box sx={{ animation: `${slideIn} 0.5s ease-out` }}>
          {/* Floating Avatar Circles */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 6, position: 'relative' }}>
            <Box sx={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid #ffffff',
              boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
              animation: `${float} 5s infinite ease-in-out`,
              transform: 'translateX(25px)'
            }}>
              <img src={avatar2} alt="User Avatar" style={{ width: '100%', height: '100%' }} />
            </Box>
            <Box sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid #ffffff',
              boxShadow: '0 16px 32px rgba(0, 0, 0, 0.12)',
              animation: `${float} 6s infinite ease-in-out alternate`,
              marginTop: '-35px',
              transform: 'translateX(-25px)'
            }}>
              <img src={avatar1} alt="User Avatar" style={{ width: '100%', height: '100%' }} />
            </Box>
          </Box>

          <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.03em', color: theme.palette.text.primary }}>
            Let's Get<br />Started
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 6, fontWeight: 500 }}>
            Grow Together
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleSwitchToSignUp}
            sx={{
              backgroundColor: isLight ? '#000000' : '#ffffff',
              color: isLight ? '#ffffff' : '#000000',
              borderRadius: '6px',
              py: 1.8,
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'uppercase',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease',
              mb: 2.5,
              '&:hover': {
                backgroundColor: isLight ? '#222222' : '#f1f5f9',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Join Now
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="text"
              onClick={handleSwitchToSignIn}
              sx={{ 
                textTransform: 'none', 
                color: 'text.secondary', 
                fontWeight: 600, 
                fontSize: '0.9rem',
                '&:hover': { color: theme.palette.text.primary }
              }}
            >
              Already have an account? Log In
            </Button>
          </Box>
        </Box>
      )}

      {/* SIGN IN VIEW */}
      {flow === 'signin' && (
        <Box sx={{ animation: `${slideIn} 0.5s ease-out` }}>
          {/* Logo / Application Name with Integrated Mobile Back Option */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            {isMobile && (
              <IconButton 
                onClick={() => {
                  setFlow('welcome');
                  setError('');
                  setSuccess('');
                  reset();
                }}
                sx={{ 
                  mr: 0.5,
                  backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)', 
                  p: 0.75,
                  '&:hover': { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                <ChevronLeft size={16} color={isLight ? '#555' : '#ccc'} />
              </IconButton>
            )}
            <Box sx={{
              width: 38,
              height: 38,
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #111 0%, #333 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Wallet size={18} color="#ffffff" />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.04em', color: theme.palette.text.primary, display: 'flex', alignItems: 'center' }}>
              Chit<span style={{ color: '#22c55e', marginLeft: '2px' }}>Manager</span>
            </Typography>
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary, letterSpacing: '-0.02em' }}>
            Welcome Back!
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 5, fontWeight: 500 }}>
            Enter Your Username & Password
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '6px' }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '6px' }}>{success}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              placeholder="Username"
              variant="standard"
              margin="normal"
              {...register('username', { required: 'Username is required' })}
              error={!!errors.username}
              helperText={errors.username?.message}
              sx={{
                mb: 3,
                '& .MuiInput-input': { py: 1.5, fontSize: '1.05rem', fontWeight: 500, color: theme.palette.text.primary },
                '& .MuiInput-underline:before': { borderBottomColor: isLight ? '#e0e0e0' : '#334155' },
                '& .MuiInput-underline:after': { borderBottomColor: '#22c55e' }
              }}
            />
            <TextField
              fullWidth
              placeholder="Password"
              type="password"
              variant="standard"
              margin="normal"
              {...register('password', { required: 'Password is required' })}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{
                mb: 5,
                '& .MuiInput-input': { py: 1.5, fontSize: '1.05rem', fontWeight: 500, color: theme.palette.text.primary },
                '& .MuiInput-underline:before': { borderBottomColor: isLight ? '#e0e0e0' : '#334155' },
                '& .MuiInput-underline:after': { borderBottomColor: '#22c55e' }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: isLight ? '#000000' : '#ffffff',
                color: isLight ? '#ffffff' : '#000000',
                borderRadius: '6px',
                py: 1.8,
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'uppercase',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                '&:hover': {
                  backgroundColor: isLight ? '#222222' : '#f1f5f9',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="text"
              onClick={handleSwitchToSignUp}
              sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Create a New Account
            </Button>
          </Box>
        </Box>
      )}

      {/* SIGN UP VIEW */}
      {flow === 'signup' && (
        <Box sx={{ animation: `${slideIn} 0.5s ease-out` }}>
          {/* Logo / Application Name with Integrated Back Option */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
            <IconButton 
              onClick={handleSwitchToSignIn}
              sx={{ 
                mr: 0.5,
                backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)', 
                p: 0.75,
                '&:hover': { backgroundColor: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <ChevronLeft size={16} color={isLight ? '#555' : '#ccc'} />
            </IconButton>
            <Box sx={{
              width: 38,
              height: 38,
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #111 0%, #333 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Wallet size={18} color="#ffffff" />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.04em', color: theme.palette.text.primary, display: 'flex', alignItems: 'center' }}>
              Chit<span style={{ color: '#ec4899', marginLeft: '2px' }}>Manager</span>
            </Typography>
          </Box>

          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: theme.palette.text.primary, letterSpacing: '-0.02em' }}>
            Create<br />Account :)
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontWeight: 500 }}>
            Register your independent tenant account
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '6px' }}>{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              placeholder="Create Username"
              variant="standard"
              margin="normal"
              {...register('username', { required: 'Username is required' })}
              error={!!errors.username}
              helperText={errors.username?.message}
              sx={{
                mb: 3,
                '& .MuiInput-input': { py: 1.5, fontSize: '1.05rem', fontWeight: 500, color: theme.palette.text.primary },
                '& .MuiInput-underline:before': { borderBottomColor: isLight ? '#e0e0e0' : '#334155' },
                '& .MuiInput-underline:after': { borderBottomColor: '#ec4899' }
              }}
            />
            <TextField
              fullWidth
              placeholder="Create Password"
              type="password"
              variant="standard"
              margin="normal"
              {...register('password', { required: 'Password is required' })}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{
                mb: 5,
                '& .MuiInput-input': { py: 1.5, fontSize: '1.05rem', fontWeight: 500, color: theme.palette.text.primary },
                '& .MuiInput-underline:before': { borderBottomColor: isLight ? '#e0e0e0' : '#334155' },
                '& .MuiInput-underline:after': { borderBottomColor: '#ec4899' }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: isLight ? '#000000' : '#ffffff',
                color: isLight ? '#ffffff' : '#000000',
                borderRadius: '6px',
                py: 1.8,
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'uppercase',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                '&:hover': {
                  backgroundColor: isLight ? '#222222' : '#f1f5f9',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {loading ? 'Creating...' : 'Sign Up'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="text"
              onClick={handleSwitchToSignIn}
              sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Already have a tenant account? Sign In
            </Button>
          </Box>
        </Box>
      )}

    </Box>
  );

  return (
    <Box sx={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      backgroundColor: isLight ? '#fafafa' : '#090d16',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {isMobile ? (
        // MOBILE VIEW: Pinterest Flow
        <Box sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Mobile Blobs */}
          <Box sx={{
            position: 'absolute',
            width: '120vw',
            height: '120vw',
            borderRadius: '50%',
            zIndex: 0,
            transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
            ...(flow === 'welcome' && {
              background: 'linear-gradient(135deg, #e0ebff 0%, #f0f4ff 100%)',
              top: '-35%',
              left: '-20%',
            }),
            ...(flow === 'signin' && {
              background: isLight 
                ? 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)' 
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(9, 13, 22, 0) 100%)',
              top: '30%',
              left: '-30%',
            }),
            ...(flow === 'signup' && {
              background: isLight 
                ? 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)' 
                : 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(9, 13, 22, 0) 100%)',
              top: '-20%',
              right: '-30%',
            })
          }} />

          {/* Form Content Wrapper */}
          <Box sx={{
            width: '100%',
            maxWidth: 400,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 4,
            zIndex: 1
          }}>
            {renderFormContent()}
          </Box>
        </Box>
      ) : (
        // DESKTOP VIEW: Immensely Creative Split Screen Inside Centered Glassmorphic Container
        <Box sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          p: 4
        }}>
          {/* Animated Blobs Backdrop */}
          {/* Blob 1 */}
          <Box sx={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            top: '-10%',
            left: '10%',
            background: flow === 'signup' 
              ? 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0) 70%)'
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 70%)',
            filter: 'blur(70px)',
            animation: `${drift1} 15s infinite ease-in-out`,
            zIndex: 1,
            transition: 'background 0.8s ease-in-out'
          }} />
          {/* Blob 2 */}
          <Box sx={{
            position: 'absolute',
            width: '550px',
            height: '550px',
            borderRadius: '50%',
            bottom: '-15%',
            right: '10%',
            background: flow === 'signup'
              ? 'radial-gradient(circle, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0) 70%)'
              : 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0) 70%)',
            filter: 'blur(75px)',
            animation: `${drift2} 18s infinite ease-in-out`,
            zIndex: 1,
            transition: 'background 0.8s ease-in-out'
          }} />
          {/* Blob 3 */}
          <Box sx={{
            position: 'absolute',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            top: '30%',
            right: '35%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%)',
            filter: 'blur(60px)',
            animation: `${drift3} 12s infinite ease-in-out`,
            zIndex: 1
          }} />

          {/* Central Glassmorphic Portal */}
          <Box sx={{
            width: '1020px',
            height: '640px',
            background: isLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(30px)',
            border: '1px solid',
            borderColor: isLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            boxShadow: isLight 
              ? '0 30px 60px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
              : '0 30px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 10,
            transition: 'all 0.5s ease'
          }}>
            
            {/* Left Panel: Form */}
            <Box sx={{
              width: '45%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 6,
              borderRight: '1px solid',
              borderColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
              position: 'relative',
              zIndex: 2
            }}>
              <Box sx={{ height: 16 }} />

              {renderFormContent()}

              {/* Bottom Copyright */}
              <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.5, fontWeight: 500 }}>
                © {new Date().getFullYear()} ChitManager. All rights reserved.
              </Typography>
            </Box>

            {/* Right Panel: Fintech Dashboard Mockup Visualizer */}
            <Box sx={{
              width: '55%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isLight ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.15)',
              overflow: 'hidden',
              zIndex: 2
            }}>
              {/* Subtly Textured Grid Overlay */}
              <Box sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: isLight
                  ? 'radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)'
                  : 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                zIndex: 1
              }} />

              {/* Glowing Ambient Halos behind widgets */}
              <Box sx={{
                position: 'absolute',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                background: flow === 'signup'
                  ? 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, transparent 70%)',
                filter: 'blur(30px)',
                zIndex: 2
              }} />

              {/* Floating Widgets Container */}
              <Box sx={{ zIndex: 3, width: '100%', height: '100%', position: 'relative' }}>
                
                {/* WIDGET 1: Savings Pool Graph */}
                <Box sx={{
                  position: 'absolute',
                  width: '280px',
                  background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(30, 41, 59, 0.85)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.05)',
                  p: 3,
                  boxShadow: isLight ? '0 20px 40px rgba(0, 0, 0, 0.03)' : '0 20px 40px rgba(0, 0, 0, 0.2)',
                  animation: `${floatSlow} 7s infinite ease-in-out`,
                  top: '12%',
                  left: '12%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px) scale(1.02) !important',
                    boxShadow: isLight ? '0 30px 50px rgba(0, 0, 0, 0.06)' : '0 30px 50px rgba(0, 0, 0, 0.35)'
                  }
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: flow === 'signup' ? '#ec4899' : '#22c55e' }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
                        Savings Pool
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                      Live
                    </Typography>
                  </Box>
                  
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', mb: 0.5, letterSpacing: '-0.02em' }}>
                    ₹8,42,500.00
                  </Typography>
                  <Typography variant="caption" sx={{ color: flow === 'signup' ? '#ec4899' : '#22c55e', fontWeight: 800 }}>
                    +14.8% annual yield
                  </Typography>
                  
                  {/* SVG Sparkline */}
                  <Box sx={{ mt: 3, height: '45px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={flow === 'signup' ? '#ec4899' : '#22c55e'} stopOpacity="0.25"/>
                          <stop offset="100%" stopColor={flow === 'signup' ? '#ec4899' : '#22c55e'} stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M0,32 Q15,36 32,20 T65,12 T90,5 L100,5 L100,40 L0,40 Z" fill="url(#chartGrad)" />
                      <path d="M0,32 Q15,36 32,20 T65,12 T90,5" fill="none" stroke={flow === 'signup' ? '#ec4899' : '#22c55e'} strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </Box>
                </Box>

                {/* WIDGET 2: Recent Savers (Overlapping circular avatars) */}
                <Box sx={{
                  position: 'absolute',
                  width: 250,
                  background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(30, 41, 59, 0.85)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.05)',
                  p: 2.5,
                  boxShadow: isLight ? '0 20px 40px rgba(0, 0, 0, 0.03)' : '0 20px 40px rgba(0, 0, 0, 0.2)',
                  animation: `${floatFast} 6s infinite ease-in-out`,
                  bottom: '12%',
                  right: '12%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px) scale(1.02) !important',
                    boxShadow: isLight ? '0 30px 50px rgba(0, 0, 0, 0.06)' : '0 30px 50px rgba(0, 0, 0, 0.35)'
                  }
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Active Chit Savers
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', position: 'relative' }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid',
                        borderColor: isLight ? '#fff' : '#1e293b',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.08)'
                      }}>
                        <img src={avatar2} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid',
                        borderColor: isLight ? '#fff' : '#1e293b',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
                        marginLeft: '-12px'
                      }}>
                        <img src={avatar1} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        border: '2px solid',
                        borderColor: isLight ? '#fff' : '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        marginLeft: '-12px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.08)'
                      }}>
                        +14
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                        16 Connected
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                        Real-time Ledger
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* WIDGET 3: Encryption Status / Provisioning Node */}
                <Box sx={{
                  position: 'absolute',
                  width: '260px',
                  background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(30, 41, 59, 0.85)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.05)',
                  p: 2.5,
                  boxShadow: isLight ? '0 20px 40px rgba(0, 0, 0, 0.03)' : '0 20px 40px rgba(0, 0, 0, 0.2)',
                  animation: `${floatSlow} 8s infinite ease-in-out alternate`,
                  top: '42%',
                  right: '15%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px) scale(1.02) !important',
                    boxShadow: isLight ? '0 30px 50px rgba(0, 0, 0, 0.06)' : '0 30px 50px rgba(0, 0, 0, 0.35)'
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: flow === 'signup' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {/* Pulsing ring around icon */}
                      <Box sx={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        border: '2px solid',
                        borderColor: flow === 'signup' ? '#ec4899' : '#22c55e',
                        borderRadius: '50%',
                        animation: `${pulseOutline} 2.5s infinite ease-out`
                      }} />
                      <Shield size={18} color={flow === 'signup' ? '#ec4899' : '#22c55e'} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                        {flow === 'signup' ? 'Isolated DB Provision' : 'Secure Partition'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {flow === 'signup' ? 'Generating Keys...' : 'AES-256 Enabled'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ 
                    py: 0.6, px: 1.8, borderRadius: '6px', 
                    backgroundColor: flow === 'signup' ? '#ec4899' : '#22c55e', 
                    color: '#ffffff', 
                    display: 'inline-block', fontSize: '0.75rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.06em'
                  }}>
                    {flow === 'signup' ? 'Sandboxed Tenant' : 'Tenant Active'}
                  </Box>
                </Box>

              </Box>
            </Box>

          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Login;
