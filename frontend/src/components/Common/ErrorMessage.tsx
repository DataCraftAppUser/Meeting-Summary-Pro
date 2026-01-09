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
      minHeight="200px"
      gap={2}
      p={3}
    >
      <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
      <Typography color="error" variant="h6" textAlign="center">
        {message}
      </Typography>
      {onRetry && (
        <Button variant="contained" onClick={onRetry}>
          נסה שנית
        </Button>
      )}
    </Box>
  );
}
