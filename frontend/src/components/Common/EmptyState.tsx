import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  message = 'אין פריטים להצגה',
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
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
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon || <InboxIcon sx={{ fontSize: 48, color: 'text.disabled' }} />}
      </Box>
      <Box>
        <Typography
          color="text.secondary"
          variant="h5"
          sx={{
            fontWeight: 500,
            mb: 1,
          }}
        >
          {message}
        </Typography>
        <Typography
          color="text.secondary"
          variant="body1"
          sx={{
            maxWidth: 400,
            mx: 'auto',
          }}
        >
          התחל על ידי יצירת סיכום פגישה חדש כדי לראות את התוכן כאן
        </Typography>
      </Box>
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            background: 'linear-gradient(135deg, #38b2ac 0%, #68d391 100%)',
            color: 'white',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(56, 178, 172, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2c7a7b 0%, #2f855a 100%)',
              boxShadow: '0 6px 20px rgba(56, 178, 172, 0.4)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
