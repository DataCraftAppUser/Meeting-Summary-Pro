import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  message = 'אירעה שגיאה. אנא נסה שנית.',
  onRetry
}: ErrorMessageProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="300px"
      gap={3}
      p={4}
      sx={{
        background: 'white',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          p: 3,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />
      </Box>
      <Box>
        <Typography
          color="error.main"
          variant="h5"
          sx={{
            fontWeight: 500,
            mb: 1,
          }}
        >
          שגיאה
        </Typography>
        <Typography
          color="text.secondary"
          variant="body1"
          sx={{
            maxWidth: 400,
            mx: 'auto',
          }}
        >
          {message}
        </Typography>
      </Box>
      {onRetry && (
        <Button
          variant="contained"
          onClick={onRetry}
          sx={{
            background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
            color: 'white',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(229, 62, 62, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #c53030 0%, #9b2c2c 100%)',
              boxShadow: '0 6px 20px rgba(229, 62, 62, 0.4)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          נסה שנית
        </Button>
      )}
    </Box>
  );
}
