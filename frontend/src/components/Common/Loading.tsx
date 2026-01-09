import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

interface LoadingProps {
  message?: string;
  size?: number;
}

export default function Loading({ message = 'טוען...', size = 40 }: LoadingProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      gap={2}
    >
      <CircularProgress size={size} />
      {message && <Typography color="text.secondary">{message}</Typography>}
    </Box>
  );
}
