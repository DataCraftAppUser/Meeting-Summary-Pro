import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Avatar,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../contexts/AuthContext';
import { useHubs, HubMember } from '../hooks/useHubs';
import { Hub } from '../types';
import Loading from '../components/Common/Loading';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

export default function HubManagement() {
  const navigate = useNavigate();
  const { hubs, currentHub, refreshHubs, setCurrentHub, loading: authLoading } = useAuth();
  const { loading: hubsLoading, updateHub, deleteHub, getHubMembers, addHubMember, removeHubMember } = useHubs();
  const { showToast } = useToast();

  const [editingHub, setEditingHub] = useState<Hub | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hubToDelete, setHubToDelete] = useState<Hub | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [members, setMembers] = useState<HubMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'owner' | 'member'>('member');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newHubName, setNewHubName] = useState('');
  const [newHubType, setNewHubType] = useState<'personal' | 'shared'>('shared');
  const [newHubColor, setNewHubColor] = useState<'green' | 'navy'>('navy');
  const [creatingHub, setCreatingHub] = useState(false);
  const hasInitialized = useRef(false);

  // Only refresh on mount if hubs are empty (initial load)
  // Don't refresh if we already have hubs loaded
  useEffect(() => {
    if (hasInitialized.current) return;
    
    // Mark as initialized immediately to prevent multiple calls
    hasInitialized.current = true;
    
    // Only refresh if we don't have hubs yet and not loading
    if (!authLoading && hubs.length === 0) {
      refreshHubs();
    }
  }, []); // Empty dependency array - only run on mount

  const handleEdit = (hub: Hub) => {
    setEditingHub(hub);
    setEditName(hub.name);
  };

  const handleSaveEdit = async () => {
    if (!editingHub) return;

    const updated = await updateHub(editingHub.id, { name: editName });
    if (updated) {
      await refreshHubs();
      setEditingHub(null);
      setEditName('');
    }
  };

  const handleDeleteClick = (hub: Hub) => {
    setHubToDelete(hub);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!hubToDelete) return;

    const success = await deleteHub(hubToDelete.id);
    if (success) {
      await refreshHubs();
      if (currentHub?.id === hubToDelete.id) {
        // If deleted hub was current, switch to first available hub
        const remainingHubs = hubs.filter(h => h.id !== hubToDelete.id);
        if (remainingHubs.length > 0) {
          setCurrentHub(remainingHubs[0]);
          navigate(`/hub/${remainingHubs[0].id}/items`);
        } else {
          setCurrentHub(null);
          navigate('/');
        }
      }
    }
    setDeleteDialogOpen(false);
    setHubToDelete(null);
  };

  const handleOpenMembers = async (hub: Hub) => {
    setSelectedHub(hub);
    setMembersDialogOpen(true);
    setLoadingMembers(true);
    try {
      const hubMembers = await getHubMembers(hub.id);
      setMembers(Array.isArray(hubMembers) ? hubMembers : []);
    } catch (error) {
      console.error('Error loading hub members:', error);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedHub || !newMemberEmail.trim()) return;

    const success = await addHubMember(selectedHub.id, newMemberEmail.trim(), newMemberRole);
    if (success) {
      const hubMembers = await getHubMembers(selectedHub.id);
      setMembers(hubMembers);
      setNewMemberEmail('');
      setNewMemberRole('member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedHub) return;

    const success = await removeHubMember(selectedHub.id, memberId);
    if (success) {
      const hubMembers = await getHubMembers(selectedHub.id);
      setMembers(hubMembers);
    }
  };

  const handleCreateHub = async () => {
    if (!newHubName.trim()) {
      showToast('יש להזין שם ל-Hub', 'error');
      return;
    }

    setCreatingHub(true);
    try {
      const hub = await api.createHub({
        name: newHubName.trim(),
        type: newHubType,
        color_theme: newHubColor,
      });
      
      if (hub) {
        showToast('Hub נוצר בהצלחה', 'success');
        await refreshHubs();
        setCreateDialogOpen(false);
        setNewHubName('');
        setNewHubType('shared');
        setNewHubColor('navy');
        
        // Switch to the new hub
        if (hub.id) {
          setCurrentHub(hub);
          navigate(`/hub/${hub.id}/items`);
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'שגיאה ביצירת Hub';
      showToast(errorMessage, 'error');
      console.error('Error creating hub:', error);
    } finally {
      setCreatingHub(false);
    }
  };

  const getHubIcon = (hub: Hub) => {
    return hub.type === 'personal' ? PersonIcon : FolderIcon;
  };

  const getHubColor = (hub: Hub) => {
    return hub.color_theme === 'green' ? '#10b981' : '#1e3a8a';
  };

  // Show loading only on initial load when we don't have hubs yet
  if (authLoading && hubs.length === 0) {
    return <Loading />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          ניהול Hubs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #38b2ac 0%, #68d391 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2c7a7b 0%, #2f855a 100%)',
            },
          }}
        >
          Hub חדש
        </Button>
      </Box>

        {hubs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            אין Hubs זמינים
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            צור Hub ראשון
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {hubs.map((hub) => {
            const HubIcon = getHubIcon(hub);
            const hubColor = getHubColor(hub);
            const isOwner = hub.role === 'owner';

            return (
              <Card
                key={hub.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                  },
                  border: currentHub?.id === hub.id ? `2px solid ${hubColor}` : '1px solid rgba(0,0,0,0.12)',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        backgroundColor: hubColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mr: 2,
                      }}
                    >
                      <HubIcon />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      {editingHub?.id === hub.id ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit();
                            }
                          }}
                        />
                      ) : (
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {hub.name}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        <Chip
                          label={hub.type === 'personal' ? 'אישי' : 'שיתופי'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            backgroundColor: hub.color_theme === 'green' ? '#d1fae5' : '#dbeafe',
                            color: hub.color_theme === 'green' ? '#065f46' : '#1e40af',
                          }}
                        />
                        {isOwner && (
                          <Chip
                            label="בעלים"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
                  {isOwner && (
                    <>
                      {editingHub?.id === hub.id ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            onClick={handleSaveEdit}
                            variant="contained"
                            color="primary"
                          >
                            שמור
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingHub(null);
                              setEditName('');
                            }}
                          >
                            ביטול
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(hub)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(hub)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </>
                  )}
                  <Button
                    size="small"
                    startIcon={<PeopleIcon />}
                    onClick={() => handleOpenMembers(hub)}
                  >
                    חברים
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setHubToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="מחיקת Hub"
        message={`האם אתה בטוח שברצונך למחוק את Hub "${hubToDelete?.name}"? פעולה זו לא ניתנת לביטול.`}
        severity="error"
      />

      {/* Members Management Dialog */}
      <Dialog
        open={membersDialogOpen}
        onClose={() => {
          setMembersDialogOpen(false);
          setSelectedHub(null);
          setMembers([]);
          setNewMemberEmail('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">ניהול חברים - {selectedHub?.name}</Typography>
            <IconButton
              onClick={() => {
                setMembersDialogOpen(false);
                setSelectedHub(null);
                setMembers([]);
                setNewMemberEmail('');
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedHub?.role === 'owner' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                הוסף חבר חדש
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="אימייל"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddMember();
                    }
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>תפקיד</InputLabel>
                  <Select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as 'owner' | 'member')}
                    label="תפקיד"
                  >
                    <MenuItem value="member">חבר</MenuItem>
                    <MenuItem value="owner">בעלים</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleAddMember}
                  disabled={!newMemberEmail.trim()}
                >
                  הוסף
                </Button>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            חברי Hub ({members.length})
          </Typography>

          {loadingMembers ? (
            <Loading />
          ) : members.length === 0 ? (
            <Alert severity="info">אין חברים ב-Hub זה</Alert>
          ) : (
            <List>
              {members
                .filter((member) => member && member.user_profiles)
                .map((member) => {
                  const userProfile = member.user_profiles;
                  const email = userProfile?.email || '';
                  const displayName = userProfile?.full_name || email || 'ללא שם';
                  
                  return (
                    <ListItem
                      key={member.id}
                      sx={{
                        border: '1px solid rgba(0,0,0,0.12)',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <Avatar
                        src={userProfile?.avatar_url}
                        sx={{ mr: 2, width: 40, height: 40 }}
                      >
                        {email ? email.charAt(0).toUpperCase() : '?'}
                      </Avatar>
                      <ListItemText
                        primary={displayName}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={member.role === 'owner' ? 'בעלים' : 'חבר'}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                backgroundColor: member.role === 'owner' ? '#fef3c7' : '#e5e7eb',
                                color: member.role === 'owner' ? '#92400e' : '#374151',
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {member.joined_at ? new Date(member.joined_at).toLocaleDateString('he-IL') : ''}
                            </Typography>
                          </Box>
                        }
                      />
                      {selectedHub?.role === 'owner' && member.role !== 'owner' && userProfile?.id && (
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveMember(userProfile.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  );
                })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setMembersDialogOpen(false);
            setSelectedHub(null);
            setMembers([]);
            setNewMemberEmail('');
          }}>
            סגור
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Hub Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setNewHubName('');
          setNewHubType('shared');
          setNewHubColor('navy');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">צור Hub חדש</Typography>
            <IconButton
              onClick={() => {
                setCreateDialogOpen(false);
                setNewHubName('');
                setNewHubType('shared');
                setNewHubColor('navy');
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="שם Hub"
              value={newHubName}
              onChange={(e) => setNewHubName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateHub();
                }
              }}
              autoFocus
            />
            
            <FormControl fullWidth>
              <InputLabel>סוג Hub</InputLabel>
              <Select
                value={newHubType}
                onChange={(e) => setNewHubType(e.target.value as 'personal' | 'shared')}
                label="סוג Hub"
              >
                <MenuItem value="personal">אישי</MenuItem>
                <MenuItem value="shared">שיתופי</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>צבע ערכת נושא</InputLabel>
              <Select
                value={newHubColor}
                onChange={(e) => setNewHubColor(e.target.value as 'green' | 'navy')}
                label="צבע ערכת נושא"
              >
                <MenuItem value="navy">כחול כהה</MenuItem>
                <MenuItem value="green">ירוק</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              setNewHubName('');
              setNewHubType('shared');
              setNewHubColor('navy');
            }}
          >
            ביטול
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateHub}
            disabled={!newHubName.trim() || creatingHub}
          >
            {creatingHub ? 'יוצר...' : 'צור Hub'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
