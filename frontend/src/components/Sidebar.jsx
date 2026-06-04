import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, FileText, CheckSquare, Landmark, LogOut } from 'lucide-react';
import { useAuthStore } from '../store';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard />, path: '/' },
    { text: 'Members', icon: <Users />, path: '/members' },
    { text: 'Chit Groups', icon: <Wallet />, path: '/chits' },
    { text: 'Collections', icon: <CheckSquare />, path: '/collections' },
    { text: 'Payouts', icon: <FileText />, path: '/payouts' },
    { text: 'Loans Issued', icon: <Landmark />, path: '/loans' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
          ChitManager
        </Typography>
      </Toolbar>
      <Box sx={{ overflow: 'auto', mt: 2, flexGrow: 1 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (handleDrawerToggle) handleDrawerToggle();
                }}
                selected={location.pathname === item.path}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    }
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'primary.dark',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: location.pathname === item.path ? 'white' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ p: 2 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main', mx: 1 }}>
            <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
              <LogOut />
            </ListItemIcon>
            <ListItemText primary="Logout" />
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
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Desktop Drawer (Permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
