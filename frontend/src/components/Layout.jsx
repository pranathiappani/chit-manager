
import { Box, Toolbar, AppBar, Typography, IconButton, useTheme } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import Sidebar from './Sidebar';
import { useThemeStore } from '../store';

const drawerWidth = 240;

const Layout = () => {
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleMode } = useThemeStore();
  
  const titleMap = {
    '/': 'Dashboard',
    '/members': 'Members',
    '/chits': 'Chit Groups',
    '/collections': 'Monthly Collections',
    '/payouts': 'Payout Management',
  };

  const currentTitle = titleMap[location.pathname] || 'ChitManager';

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {currentTitle}
          </Typography>
          <IconButton onClick={toggleMode} color="inherit" sx={{ ml: 1 }}>
            {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}
      >
        <Toolbar />
        <div className="fade-in-up">
          <Outlet />
        </div>
      </Box>
    </Box>
  );
};

export default Layout;
