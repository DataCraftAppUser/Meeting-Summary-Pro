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
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigate('/meetings')}
          sx={{ mr: 2 }}
        >
          <HomeIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <BusinessIcon />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            DataCraftApp
          </Typography>
        </Box>

        <Typography variant="subtitle2" sx={{ mr: 3, display: { xs: 'none', sm: 'block' } }}>
          סיכומי פגישות
        </Typography>

        <IconButton
          color="inherit"
          onClick={() => navigate('/settings')}
          sx={{ mr: 1 }}
          title="הגדרות"
        >
          <SettingsIcon />
        </IconButton>

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/meetings/new')}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'grey.100',
            },
          }}
        >
          {isMobile ? 'חדש' : 'סיכום חדש'}
        </Button>
      </Toolbar>
    </AppBar>
  );
}
