import React from 'react';
import { Box, Container, Typography, Paper, CircularProgress } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../contexts/AuthContext';

const WaitingApproval: React.FC = () => {
  const { user, signOut } = useAuth();

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
          <Box sx={{ mb: 3 }}>
            <CircularProgress size={60} />
          </Box>
          <AccessTimeIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" component="h1" gutterBottom>
            ממתין לאישור
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            החשבון שלך ({user?.email}) ממתין לאישור מנהל המערכת.
            <br />
            תקבל הודעה ברגע שהחשבון יאושר.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            אם אתה חושב שזה טעות, צור קשר עם מנהל המערכת.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default WaitingApproval;
