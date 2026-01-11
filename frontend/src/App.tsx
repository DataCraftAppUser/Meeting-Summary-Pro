import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, ThemeProvider } from '@mui/material';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { theme } from './theme';
import Layout from './components/Layout/Layout';
import HubRoute from './components/Common/HubRoute';
import ItemsList from './pages/ItemsList';
import ItemEditor from './pages/ItemEditor';
import ItemView from './pages/ItemView';
import Settings from './pages/Settings';
import Login from './pages/Login';
import WaitingApproval from './pages/WaitingApproval';
import AdminPanel from './pages/AdminPanel';
import PromptsManagement from './pages/PromptsManagement';
import { supabase } from './services/supabase';

// Component to handle auth callback
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth error:', error);
        navigate('/login');
        return;
      }

      if (!session) {
        navigate('/login');
        return;
      }

      // Wait for user profile to load (handled by AuthProvider)
      // The AuthProvider will handle redirect based on user status
    };

    handleAuthCallback();
  }, [navigate]);

  // Wait for user to load, then let AuthProvider handle redirect
  useEffect(() => {
    if (!loading && user) {
      // User loaded - AuthProvider will handle redirect based on status
      if (user.status === 'pending') {
        navigate('/waiting-approval', { replace: true });
      } else if (user.status === 'approved') {
        // Will be handled by AuthProvider's routing logic
        navigate('/', { replace: true });
      }
    } else if (!loading && !user) {
      // No user after loading - redirect to login
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Box>מתחבר...</Box>
    </Box>
  );
};

// Protected routes wrapper
const ProtectedRoutes: React.FC = () => {
  const { user, loading, currentHub } = useAuth();
  const location = useLocation();
  
  // Show loading screen while checking session or loading user data
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Box>טוען...</Box>
      </Box>
    );
  }
  
  // If no user after loading, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is pending, redirect to waiting approval
  if (user.status === 'pending') {
    return <Navigate to="/waiting-approval" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={currentHub ? `/hub/${currentHub.id}/items` : '/login'} replace />} />
        <Route path="/hub/:hub_id/items" element={<HubRoute><ItemsList /></HubRoute>} />
        <Route path="/hub/:hub_id/items/new" element={<HubRoute><ItemEditor /></HubRoute>} />
        <Route path="/hub/:hub_id/items/:id/edit" element={<HubRoute><ItemEditor /></HubRoute>} />
        <Route path="/hub/:hub_id/items/:id" element={<HubRoute><ItemView /></HubRoute>} />
        <Route path="/hub/:hub_id/settings" element={<HubRoute><Settings /></HubRoute>} />
        <Route 
          path="/admin" 
          element={
            user && user.is_admin ? (
              <AdminPanel />
            ) : (
              <Navigate to={currentHub ? `/hub/${currentHub.id}/items` : '/login'} replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to={currentHub ? `/hub/${currentHub.id}/items` : '/login'} replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/waiting-approval" element={<WaitingApproval />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
