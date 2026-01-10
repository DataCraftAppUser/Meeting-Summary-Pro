import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Header() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }}
    >
      <Toolbar sx={{ py: 1.5 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigate('/items')}
          sx={{
            mr: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(26, 54, 93, 0.04)',
            '&:hover': {
              backgroundColor: 'rgba(26, 54, 93, 0.08)',
            },
          }}
        >
          <HomeIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
              color: 'white',
            }}
          >
            <BusinessIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.01em',
              }}
            >
              DataCraft Meeting Pro
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: { xs: 'none', md: 'block' },
                mt: -0.5,
              }}
            >
              פלטפורמת סיכומי פגישות מתקדמת
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="subtitle1"
          sx={{
            mr: 3,
            display: { xs: 'none', sm: 'block' },
            fontWeight: 500,
            color: 'text.secondary',
          }}
        >
          פריטים
        </Typography>

        <IconButton
          color="inherit"
          onClick={() => navigate('/settings')}
          sx={{
            mr: 1,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(26, 54, 93, 0.04)',
            },
          }}
          title="הגדרות"
        >
          <SettingsIcon />
        </IconButton>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/items/new')}
          sx={{
            background: 'linear-gradient(135deg, #38b2ac 0%, #68d391 100%)',
            color: 'white',
            fontWeight: 600,
            px: 3,
            py: 1,
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
          {isMobile ? 'חדש' : 'פריט חדש'}
        </Button>
      </Toolbar>
    </AppBar>
  );
}
