import React, { useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface HubRouteProps {
  children: React.ReactNode;
}

const HubRoute: React.FC<HubRouteProps> = ({ children }) => {
  const { hub_id } = useParams<{ hub_id: string }>();
  const { user, currentHub, hubs, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If hub_id in URL doesn't match current hub, verify access
    if (hub_id && hub_id !== currentHub?.id && !loading) {
      verifyHubAccess();
    }
  }, [hub_id, currentHub, loading]);

  const verifyHubAccess = async () => {
    if (!hub_id || !user) return;

    try {
      const { data: { session } } = await import('../../services/supabase').then(m => 
        m.supabase.auth.getSession()
      );

      if (!session) {
        navigate('/login');
        return;
      }

      const response = await api.post('/api/auth/verify-hub-access', { hub_id }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.data.success) {
        navigate('/access-denied');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        navigate('/access-denied');
      } else {
        console.error('Error verifying hub access:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.status === 'pending') {
    return <Navigate to="/waiting-approval" replace />;
  }

  if (!hub_id) {
    // Redirect to first hub or create hub page
    if (hubs.length > 0) {
      return <Navigate to={`/hub/${hubs[0].id}/items`} replace />;
    }
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">אין לך גישה ל-Hub</Typography>
        <Typography variant="body2" color="text.secondary">
          אנא צור קשר עם מנהל המערכת
        </Typography>
      </Box>
    );
  }

  // Verify hub is in user's hubs list
  const hasAccess = hubs.some(h => h.id === hub_id);
  if (!hasAccess) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">גישה נדחתה</Typography>
        <Typography variant="body2" color="text.secondary">
          אין לך הרשאה לגשת ל-Hub זה
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
};

export default HubRoute;
