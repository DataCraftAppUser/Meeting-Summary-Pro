import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useAuth } from '../../contexts/AuthContext';
import { Hub } from '../../types';

export default function Header() {
  const navigate = useNavigate();
  const { hub_id } = useParams<{ hub_id?: string }>();
  const { user, signOut, currentHub, hubs, setCurrentHub } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleHubSelect = (hub: Hub) => {
    setCurrentHub(hub);
    navigate(`/hub/${hub.id}/items`);
    handleProfileMenuClose();
  };

  const handleSignOut = async () => {
    await signOut();
    handleProfileMenuClose();
  };

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
          onClick={() => navigate(currentHub ? `/hub/${currentHub.id}/items` : '/items')}
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
            <AutoAwesomeIcon sx={{ fontSize: 24 }} />
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
              DocCraftAI
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: { xs: 'none', md: 'block' },
                mt: -0.5,
              }}
            >
              תיעוד חכם וניהול ידע מבוסס AI
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            const targetHub = hub_id || currentHub?.id;
            console.log('🆕 Header button clicked, hub_id:', hub_id, 'currentHub:', currentHub?.id, 'target:', targetHub);
            if (targetHub) {
              navigate(`/hub/${targetHub}/items/new`);
            } else {
              console.error('❌ No hub_id available!');
            }
          }}
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
            mr: 2,
          }}
        >
          {isMobile ? 'חדש' : 'תוכן חדש'}
        </Button>

        <Button
          onClick={handleProfileMenuOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.primary',
            textTransform: 'none',
            p: 0.5,
            borderRadius: '50%',
            minWidth: 0,
            '&:hover': {
              backgroundColor: 'rgba(26, 54, 93, 0.04)',
            },
          }}
        >
          <Avatar
            src={user?.avatar_url}
            alt={user?.full_name || user?.email}
            sx={{ 
              width: 36, 
              height: 36,
              border: '2px solid white',
              boxShadow: '0 0 0 1px rgba(226, 232, 240, 1)'
            }}
          >
            {user?.email?.charAt(0).toUpperCase()}
          </Avatar>
          <KeyboardArrowDownIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 0.2 }} />
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 280,
              maxHeight: 500,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              borderRadius: 2,
              border: '1px solid rgba(226, 232, 240, 0.8)',
            }
          }}
        >
          <Box sx={{ px: 2, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Avatar
                src={user?.avatar_url}
                alt={user?.full_name}
                sx={{ width: 40, height: 40 }}
              />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {user?.full_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Divider />
          
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                color: 'text.secondary',
                letterSpacing: '0.05em'
              }}
            >
              החלף Hub
            </Typography>
          </Box>

          {hubs.map((hub) => {
            const isSelected = hub.id === currentHub?.id;
            const hubColor = hub.color_theme === 'green' ? '#10b981' : '#1e3a8a';
            const HubIcon = hub.type === 'personal' ? PersonIcon : FolderIcon;

            return (
              <MenuItem
                key={hub.id}
                onClick={() => handleHubSelect(hub)}
                selected={isSelected}
                sx={{
                  py: 1,
                  px: 2,
                  mx: 1,
                  borderRadius: 1.5,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(26, 54, 93, 0.06)',
                    '&:hover': {
                      backgroundColor: 'rgba(26, 54, 93, 0.1)',
                    }
                  }
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    backgroundColor: hubColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mr: 1.5,
                  }}
                >
                  <HubIcon sx={{ fontSize: 18 }} />
                </Box>
                <Box sx={{ flexGrow: 1, textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500 }}>
                    {hub.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', mt: 0.5 }}>
                    <Chip
                      label={hub.type === 'personal' ? 'אישי' : 'שיתופי'}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.65rem',
                        backgroundColor: hub.color_theme === 'green' ? '#d1fae5' : '#dbeafe',
                        color: hub.color_theme === 'green' ? '#065f46' : '#1e40af',
                      }}
                    />
                    {hub.role === 'owner' && (
                      <Chip
                        label="בעלים"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          backgroundColor: '#fef3c7',
                          color: '#92400e',
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </MenuItem>
            );
          })}

          <Divider sx={{ my: 1 }} />
          
          <MenuItem
            onClick={() => {
              const targetHub = hub_id || currentHub?.id;
              if (targetHub) {
                navigate(`/hub/${targetHub}/settings`);
              }
              handleProfileMenuClose();
            }}
            sx={{ py: 1.5, px: 2 }}
          >
            <SettingsIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>הגדרות</Typography>
          </MenuItem>

          {user?.is_admin && (
            <MenuItem
              onClick={() => {
                navigate('/admin');
                handleProfileMenuClose();
              }}
              sx={{ py: 1.5, px: 2 }}
            >
              <DashboardIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>לוח בקרה - מנהל</Typography>
            </MenuItem>
          )}

          <MenuItem 
            onClick={handleSignOut}
            sx={{ 
              py: 1.5, 
              px: 2,
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.lighter',
              }
            }}
          >
            <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>התנתק</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
