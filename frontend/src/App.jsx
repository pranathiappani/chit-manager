import { useMemo, useEffect } from 'react';
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

const parseJwt = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const jsonPayload = decodeURIComponent(
      atob(base64 + padding)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const isExpired = useMemo(() => {
    if (!token) return true;
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
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
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!token) return;

    const payload = parseJwt(token);
    if (payload && payload.exp) {
      const expTimeMs = payload.exp * 1000;
      const timeLeft = expTimeMs - Date.now();

      if (timeLeft <= 0) {
        logout();
      } else {
        const timer = setTimeout(() => {
          logout();
          alert("Your session has expired. Please log in again.");
        }, timeLeft);

        return () => clearTimeout(timer);
      }
    } else {
      logout();
    }
  }, [token, logout]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login initialFlow="signin" />} />
          <Route path="/signup" element={<Login initialFlow="signup" />} />
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
