import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, FileText, CheckSquare, Landmark, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../store';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const theme = useTheme();

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { text: 'Members', icon: <Users size={20} />, path: '/members' },
    { text: 'Chit Groups', icon: <Wallet size={20} />, path: '/chits' },
    { text: 'Collections', icon: <CheckSquare size={20} />, path: '/collections' },
    { text: 'Payouts', icon: <FileText size={20} />, path: '/payouts' },
    { text: 'Loans Issued', icon: <Landmark size={20} />, path: '/loans' },
    { text: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.username || 'Admin';
  const displayRole = user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Tenant Owner';

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Premium Branding Header */}
      <Toolbar sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36,
          height: 36,
          borderRadius: '8px',
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
        }}>
          <Wallet size={18} color="#ffffff" />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.03em', color: 'text.primary', display: 'flex', alignItems: 'center', lineHeight: 1.2 }}>
            Chit<span style={{ color: '#22c55e', marginLeft: '2px' }}>Manager</span>
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.8 }}>
            Enterprise Edition
          </Typography>
        </Box>
      </Toolbar>

      {/* Navigation List */}
      <Box sx={{ overflow: 'auto', mt: 2, flexGrow: 1 }}>
        <List sx={{ px: 0 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (handleDrawerToggle) handleDrawerToggle();
                  }}
                  selected={isActive}
                  sx={{
                    mx: 1.5,
                    borderRadius: '8px',
                    py: 1.2,
                    px: 2,
                    position: 'relative',
                    transition: 'all 0.2s ease-in-out',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    backgroundColor: isActive 
                      ? theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.15)'
                      : 'transparent',
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.15)',
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                      }
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'light' ? 'rgba(99, 102, 241, 0.04)' : 'rgba(99, 102, 241, 0.08)',
                      color: 'text.primary',
                      transform: 'translateX(3px)',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.main',
                        transform: 'scale(1.1)',
                      }
                    },
                    '& .MuiListItemIcon-root': {
                      transition: 'all 0.2s ease-in-out',
                    },
                    // Left neon indicator bar
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: -8,
                      top: '20%',
                      height: '60%',
                      width: '4px',
                      borderRadius: '0 4px 4px 0',
                      backgroundColor: 'primary.main',
                      transform: isActive ? 'scaleY(1)' : 'scaleY(0)',
                      transformOrigin: 'center',
                      transition: 'transform 0.2s ease-in-out',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ sx: { fontWeight: isActive ? 700 : 500, fontSize: '0.92rem' } }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User Profile & Logout Box */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', mt: 'auto' }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: '8px',
          backgroundColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.04)',
          border: '1px solid',
          borderColor: theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)',
          mb: 1
        }}>
          {/* User Initials Avatar with Gradient */}
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.9rem',
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)'
          }}>
            {displayName.substring(0, 2).toUpperCase()}
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
              {displayName}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem', display: 'block' }}>
              {displayRole}
            </Typography>
          </Box>
        </Box>

        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: '8px', color: 'error.main', py: 1, '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' } }}>
            <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
              <LogOut size={20} />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ sx: { fontWeight: 700, fontSize: '0.9rem' } }} 
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer (Temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#0f172a',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Desktop Drawer (Permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth, 
            borderRight: '1px solid', 
            borderColor: 'divider',
            backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#090d16',
            backgroundImage: 'none',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
