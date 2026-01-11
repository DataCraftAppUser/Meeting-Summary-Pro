import React, { useEffect } from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { signInWithGoogle, user, loading, currentHub, hubs } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in (immediate redirect, no delay)
  useEffect(() => {
    if (!loading && user && user.status === 'approved') {
      // Wait for hubs to load if not loaded yet
      if (hubs.length === 0) {
        return; // Wait for hubs
      }
      
      const hubId = currentHub?.id || user.last_active_hub_id || hubs[0]?.id;
      if (hubId) {
        console.log('✅ User already logged in, redirecting to hub:', hubId);
        navigate(`/hub/${hubId}/items`, { replace: true });
      }
    }
  }, [user, loading, currentHub, hubs, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
            DocCraftAI
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            התחבר עם Google כדי להתחיל
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            fullWidth
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #357ae8 0%, #2d8f47 100%)',
              },
            }}
          >
            התחבר עם Google
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
