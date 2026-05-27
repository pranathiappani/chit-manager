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
  if (!token) {
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
