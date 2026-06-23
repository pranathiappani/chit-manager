import React, { useState } from 'react';
import { Box, Toolbar, AppBar, Typography, IconButton, useTheme } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useThemeStore } from '../store';

const drawerWidth = 240;

const Layout = () => {
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const titleMap = {
    '/': 'Dashboard',
    '/members': 'Members',
    '/chits': 'Chit Groups',
    '/collections': 'Monthly Collections',
    '/payouts': 'Payout Management',
    '/loans': 'Loans Issued',
  };

  const currentTitle = titleMap[location.pathname] || 'ChitManager';

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <Menu size={20} />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {currentTitle}
          </Typography>
          <IconButton onClick={toggleMode} color="inherit" sx={{ ml: 1 }}>
            {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 }, 
          minHeight: '100vh',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: 'background.default',
          background: (theme) => theme.palette.mode === 'light'
            ? 'radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.04) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.04) 0%, transparent 40%), #f8fafc'
            : 'radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.06) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.06) 0%, transparent 40%), #0f172a',
          position: 'relative',
        }}
      >
        <Toolbar />
        <div className="fade-in-up" style={{ position: 'relative', zIndex: 1 }}>
          <Outlet />
        </div>
      </Box>
    </Box>
  );
};

export default Layout;
