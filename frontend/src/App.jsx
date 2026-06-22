import { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Chits from './pages/Chits';
import Collections from './pages/Collections';
import Payouts from './pages/Payouts';
import Loans from './pages/Loans';
import Layout from './components/Layout';
import { useAuthStore, useThemeStore } from './store';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const isExpired = useMemo(() => {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      // Decode the payload part of the JWT
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false; // If no exp claim, assume valid
      
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (e) {
      return true; // Parse failure treats token as expired
    }
  }, [token]);

  if (isExpired) {
    if (token) {
      logout();
    }
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="chits" element={<Chits />} />
            <Route path="collections" element={<Collections />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="loans" element={<Loans />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
