import React, { useState, useEffect, Fragment } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  Select,
  Autocomplete,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import SaveIcon from '@mui/icons-material/Save';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useAuth } from '../contexts/AuthContext';
import { useHubs, HubMember } from '../hooks/useHubs';
import { usePrompts, Prompt } from '../hooks/usePrompts';
import { api } from '../services/api';
import { supabase } from '../services/supabase';
import { Hub } from '../types';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import Loading from '../components/Common/Loading';

interface PendingUser {
  id: string;
  email: string;
  full_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const AdminPanel: React.FC = () => {
  const { user, hubs, refreshHubs, loading: authLoading } = useAuth();
  const { updateHub, deleteHub, getHubMembers, addHubMember, removeHubMember } = useHubs();
  const { prompts, loading: promptsLoading, fetchPrompts, updatePrompt } = usePrompts();
  const { showToast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createHubOpen, setCreateHubOpen] = useState(false);
  const [newHubName, setNewHubName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Hub management states
  const [editingHub, setEditingHub] = useState<Hub | null>(null);
  const [editHubName, setEditHubName] = useState('');
  const [deleteHubDialogOpen, setDeleteHubDialogOpen] = useState(false);
  const [hubToDelete, setHubToDelete] = useState<Hub | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [members, setMembers] = useState<HubMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'owner' | 'member'>('member');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; email: string; full_name?: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; full_name?: string } | null>(null);

  // Prompts management states
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editPromptContent, setEditPromptContent] = useState('');
  const [editPromptConfig, setEditPromptConfig] = useState('');
  const [processingPrompt, setProcessingPrompt] = useState(false);

  useEffect(() => {
    if (user?.is_admin) {
      loadPendingUsers();
      refreshHubs();
      fetchPrompts();
    }
  }, [user]);

  const loadPendingUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await api.get('/api/admin/pending-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.data.success) {
        setPendingUsers(response.data.data || []);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'שגיאה בטעינת משתמשים');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await api.post(
        `/admin/approve-user/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess('משתמש אושר בהצלחה');
        loadPendingUsers();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'שגיאה באישור משתמש');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await api.post(
        `/api/admin/reject-user/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess('משתמש נדחה');
        loadPendingUsers();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'שגיאה בדחיית משתמש');
    }
  };

  const handleCreateHub = async () => {
    if (!newHubName.trim()) {
      setError('שם Hub נדרש');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await api.post(
        '/api/hubs',
        {
          name: newHubName,
          type: 'shared',
          color_theme: 'navy',
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess('Hub נוצר בהצלחה');
        setCreateHubOpen(false);
        setNewHubName('');
        await refreshHubs();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'שגיאה ביצירת Hub');
    }
  };

  const handleEditHub = (hub: Hub) => {
    setEditingHub(hub);
    setEditHubName(hub.name);
  };

  const handleSaveHubEdit = async () => {
    if (!editingHub || !editHubName.trim()) return;

    const updated = await updateHub(editingHub.id, { name: editHubName.trim() });
    if (updated) {
      await refreshHubs();
      setEditingHub(null);
      setEditHubName('');
      setSuccess('Hub עודכן בהצלחה');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDeleteHubClick = (hub: Hub) => {
    setHubToDelete(hub);
    setDeleteHubDialogOpen(true);
  };

  const handleConfirmDeleteHub = async () => {
    if (!hubToDelete) return;

    const success = await deleteHub(hubToDelete.id);
    if (success) {
      await refreshHubs();
      setDeleteHubDialogOpen(false);
      setHubToDelete(null);
      setSuccess('Hub נמחק בהצלחה');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleOpenMembers = async (hub: Hub) => {
    setSelectedHub(hub);
    setMembersDialogOpen(true);
    setLoadingMembers(true);
    setLoadingUsers(true);
    try {
      const [hubMembers, users] = await Promise.all([
        getHubMembers(hub.id),
        api.getAllUsers()
      ]);
      setMembers(Array.isArray(hubMembers) ? hubMembers : []);
      setAllUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('Error loading members/users:', error);
      setMembers([]);
      setAllUsers([]);
    } finally {
      setLoadingMembers(false);
      setLoadingUsers(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedHub || !selectedUser) {
      setError('נא לבחור משתמש');
      return;
    }

    const success = await addHubMember(selectedHub.id, selectedUser.email, newMemberRole);
    if (success) {
      const hubMembers = await getHubMembers(selectedHub.id);
      setMembers(Array.isArray(hubMembers) ? hubMembers : []);
      setSelectedUser(null);
      setNewMemberEmail('');
      setNewMemberRole('member');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedHub) return;

    const success = await removeHubMember(selectedHub.id, memberId);
    if (success) {
      const hubMembers = await getHubMembers(selectedHub.id);
      setMembers(Array.isArray(hubMembers) ? hubMembers : []);
    }
  };

  // Prompts management functions
  const handleStartEditPrompt = (prompt: Prompt) => {
    setEditingPromptId(prompt.id);
    setEditPromptContent(prompt.content || '');
    setEditPromptConfig(prompt.configuration ? JSON.stringify(prompt.configuration, null, 2) : '');
  };

  const handleCancelEditPrompt = () => {
    setEditingPromptId(null);
    setEditPromptContent('');
    setEditPromptConfig('');
  };

  const handleSavePromptEdit = async (prompt: Prompt) => {
    try {
      setProcessingPrompt(true);
      setError(null);

      let configuration;
      if (editPromptConfig.trim()) {
        try {
          configuration = JSON.parse(editPromptConfig);
        } catch (e) {
          setError('Configuration אינו JSON תקין');
          return;
        }
      }

      const success = await updatePrompt(prompt.id, editPromptContent, configuration);
      if (success) {
        setSuccess('פרומפט עודכן בהצלחה');
        setEditingPromptId(null);
        setEditPromptContent('');
        setEditPromptConfig('');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('שגיאה בעדכון פרומפט');
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון פרומפט');
    } finally {
      setProcessingPrompt(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return <Loading />;
  }

  // Check admin access
  if (!user?.is_admin) {
    return (
      <Container>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">גישה נדחתה</Typography>
          <Typography variant="body2" color="text.secondary">
            רק מנהלים יכולים לגשת לדף זה
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">לוח בקרה - מנהל</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateHubOpen(true)}
        >
          צור Hub חדש
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            משתמשים ממתינים לאישור ({pendingUsers.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>אימייל</TableCell>
                <TableCell>שם</TableCell>
                <TableCell>תאריך הרשמה</TableCell>
                <TableCell>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    טוען...
                  </TableCell>
                </TableRow>
              ) : pendingUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    אין משתמשים ממתינים לאישור
                  </TableCell>
                </TableRow>
              ) : (
                pendingUsers.map((pendingUser) => (
                  <TableRow key={pendingUser.id}>
                    <TableCell>{pendingUser.email}</TableCell>
                    <TableCell>{pendingUser.full_name || '-'}</TableCell>
                    <TableCell>
                      {new Date(pendingUser.created_at).toLocaleDateString('he-IL')}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="success"
                        onClick={() => handleApproveUser(pendingUser.id)}
                        title="אשר"
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleRejectUser(pendingUser.id)}
                        title="דחה"
                      >
                        <CancelIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            ניהול Hubs ({hubs.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>שם</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>סוג</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>תאריך יצירה</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hubs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    אין Hubs זמינים
                  </TableCell>
                </TableRow>
              ) : (
                hubs.map((hub) => (
                  <TableRow key={hub.id}>
                    <TableCell>
                      {editingHub?.id === hub.id ? (
                        <TextField
                          size="small"
                          value={editHubName}
                          onChange={(e) => setEditHubName(e.target.value)}
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveHubEdit();
                            }
                          }}
                          sx={{ minWidth: 200 }}
                        />
                      ) : (
                        <Typography variant="body1">{hub.name}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={hub.type === 'personal' ? 'אישי' : 'שיתופי'}
                        size="small"
                        color={hub.type === 'personal' ? 'default' : 'primary'}
                      />
                    </TableCell>
                    <TableCell>
                      {hub.created_at
                        ? new Date(hub.created_at).toLocaleDateString('he-IL')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {editingHub?.id === hub.id ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={handleSaveHubEdit}
                            title="שמור"
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingHub(null);
                              setEditHubName('');
                            }}
                            title="ביטול"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditHub(hub)}
                            title="ערוך"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteHubClick(hub)}
                            title="מחק"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => handleOpenMembers(hub)}
                            title="חברים"
                          >
                            <PeopleIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={createHubOpen} onClose={() => setCreateHubOpen(false)}>
        <DialogTitle>צור Hub חדש</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="שם Hub"
            fullWidth
            variant="outlined"
            value={newHubName}
            onChange={(e) => setNewHubName(e.target.value)}
            sx={{ mt: 2 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateHub();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateHubOpen(false)}>ביטול</Button>
          <Button onClick={handleCreateHub} variant="contained">
            צור
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Hub Confirmation Dialog */}
      <ConfirmDialog
        open={deleteHubDialogOpen}
        onCancel={() => {
          setDeleteHubDialogOpen(false);
          setHubToDelete(null);
        }}
        onConfirm={handleConfirmDeleteHub}
        title="מחיקת Hub"
        message={`האם אתה בטוח שברצונך למחוק את Hub "${hubToDelete?.name}"? פעולה זו לא ניתנת לביטול.`}
        severity="error"
      />

      {/* Members Dialog */}
      <Dialog 
        open={membersDialogOpen} 
        onClose={() => {
          setMembersDialogOpen(false);
          setSelectedUser(null);
          setNewMemberEmail('');
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          חברי Hub: {selectedHub?.name}
        </DialogTitle>
        <DialogContent>
          {loadingMembers ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>טוען...</Box>
          ) : (
            <>
              <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <Autocomplete
                  size="small"
                  options={allUsers}
                  getOptionLabel={(option) => option.email || ''}
                  value={selectedUser}
                  onChange={(_, newValue) => {
                    setSelectedUser(newValue);
                    if (newValue) {
                      setNewMemberEmail(newValue.email);
                    }
                  }}
                  loading={loadingUsers}
                  sx={{ flexGrow: 1 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="בחר משתמש"
                      placeholder="הקלד לחיפוש..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2">{option.email}</Typography>
                        {option.full_name && (
                          <Typography variant="caption" color="text.secondary">
                            {option.full_name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  filterOptions={(options, { inputValue }) => {
                    return options.filter((option) =>
                      option.email.toLowerCase().includes(inputValue.toLowerCase()) ||
                      (option.full_name && option.full_name.toLowerCase().includes(inputValue.toLowerCase()))
                    );
                  }}
                />
                <Select
                  size="small"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as 'owner' | 'member')}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="member">חבר</MenuItem>
                  <MenuItem value="owner">בעלים</MenuItem>
                </Select>
                <Button
                  variant="contained"
                  onClick={handleAddMember}
                  disabled={!selectedUser}
                >
                  הוסף
                </Button>
              </Box>
              {members.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  אין חברים ב-Hub זה
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>אימייל</TableCell>
                        <TableCell>תפקיד</TableCell>
                        <TableCell>פעולות</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            {member.user_profiles?.email || '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={member.role === 'owner' ? 'בעלים' : 'חבר'}
                              size="small"
                              color={member.role === 'owner' ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveMember(member.id)}
                              title="הסר"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>סגור</Button>
        </DialogActions>
      </Dialog>

      {/* Prompts Management */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            ניהול פרומפטים AI ({prompts.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>שם</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>תיאור</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>תוכן</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>תאריך עדכון</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promptsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    טוען...
                  </TableCell>
                </TableRow>
              ) : prompts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    אין פרומפטים זמינים
                  </TableCell>
                </TableRow>
              ) : (
                prompts.map((prompt) => (
                  <Fragment key={prompt.id}>
                    {editingPromptId === prompt.id ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ p: 0 }}>
                          <Box sx={{ p: 3, backgroundColor: '#f9fafb', borderTop: '2px solid', borderColor: 'primary.main' }}>
                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                              עריכת פרומפט: {prompt.name}
                            </Typography>
                            <TextField
                              fullWidth
                              multiline
                              minRows={10}
                              maxRows={20}
                              label="תוכן הפרומפט"
                              value={editPromptContent}
                              onChange={(e) => setEditPromptContent(e.target.value)}
                              variant="outlined"
                              sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: 'white',
                                  fontFamily: 'monospace',
                                  fontSize: '0.85rem',
                                },
                              }}
                            />
                            <TextField
                              fullWidth
                              multiline
                              minRows={2}
                              maxRows={5}
                              label="Configuration (JSON)"
                              value={editPromptConfig}
                              onChange={(e) => setEditPromptConfig(e.target.value)}
                              variant="outlined"
                              placeholder='{"temperature": 0.7}'
                              sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: 'white',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                },
                              }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={handleCancelEditPrompt}
                                disabled={processingPrompt}
                                startIcon={<CancelIcon />}
                              >
                                ביטול
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleSavePromptEdit(prompt)}
                                disabled={processingPrompt}
                                startIcon={<SaveIcon />}
                              >
                                {processingPrompt ? 'שומר...' : 'שמור שינויים'}
                              </Button>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow
                        sx={{
                          '&:hover': {
                            backgroundColor: '#f5f5f5',
                          },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>{prompt.name}</TableCell>
                        <TableCell>{prompt.description || '-'}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'text.secondary',
                            }}
                          >
                            {prompt.content || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {prompt.updated_at
                            ? new Date(prompt.updated_at).toLocaleDateString('he-IL')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleStartEditPrompt(prompt)}
                            color="primary"
                            title="ערוך"
                            sx={{
                              '&:hover': {
                                backgroundColor: 'primary.lighter',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default AdminPanel;
