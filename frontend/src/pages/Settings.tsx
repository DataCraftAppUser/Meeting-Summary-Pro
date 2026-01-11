import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import BusinessIcon from '@mui/icons-material/Business';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useTopics } from '../hooks/useTopics';
import { useToast } from '../hooks/useToast';
import Loading from '../components/Common/Loading';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import { Workspace, Topic } from '../types';

export default function Settings() {
  const navigate = useNavigate();
  const { hub_id } = useParams<{ hub_id: string }>();
  const { workspaces, loading: loadingWorkspaces, fetchWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaces();
  const { topics, loading: loadingTopics, fetchTopics, createTopic, updateTopic, deleteTopic } = useTopics();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'workspaces' | 'topics'>('workspaces');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<Workspace | Topic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (hub_id) {
      fetchWorkspaces(hub_id);
      fetchTopics(hub_id);
    }
  }, [hub_id]);

  const handleStartEdit = (entity: Workspace | Topic) => {
    setEditingId(entity.id);
    setEditName(entity.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async () => {
    if (!hub_id || !editingId || !editName.trim()) return;

    try {
      setProcessing(true);
      setError(null);

      if (activeTab === 'workspaces') {
        await updateWorkspace(editingId, { name: editName.trim() }, hub_id);
        await fetchWorkspaces(hub_id);
        setSuccess('עולם תוכן עודכן בהצלחה');
      } else {
        const topic = topics.find((t) => t.id === editingId);
        if (topic) {
          await updateTopic(editingId, {
            name: editName.trim(),
            workspace_id: topic.workspace_id || '',
            status: topic.status,
          }, hub_id);
          await fetchTopics(hub_id);
          setSuccess('נושא עודכן בהצלחה');
        }
      }

      setEditingId(null);
      setEditName('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'שגיאה בעדכון');
      showToast('שגיאה בעדכון', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteClick = (entity: Workspace | Topic) => {
    setEntityToDelete(entity);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!hub_id || !entityToDelete) return;

    try {
      setProcessing(true);
      setError(null);

      if (activeTab === 'workspaces') {
        await deleteWorkspace(entityToDelete.id, hub_id);
        await fetchWorkspaces(hub_id);
        setSuccess('עולם תוכן נמחק בהצלחה');
      } else {
        await deleteTopic(entityToDelete.id, hub_id);
        await fetchTopics(hub_id);
        setSuccess('נושא נמחק בהצלחה');
      }

      setDeleteDialogOpen(false);
      setEntityToDelete(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'שגיאה במחיקה');
      showToast('שגיאה במחיקה', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreate = async () => {
    if (!hub_id || !newName.trim()) {
      setError('נא להזין שם');
      return;
    }

    if (activeTab === 'topics' && !selectedWorkspaceId) {
      setError('נא לבחור עולם תוכן');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      if (activeTab === 'workspaces') {
        await createWorkspace({ name: newName.trim() }, hub_id);
        await fetchWorkspaces(hub_id);
        setSuccess('עולם תוכן נוצר בהצלחה');
      } else {
        await createTopic({ name: newName.trim(), workspace_id: selectedWorkspaceId, status: 'active' }, hub_id);
        await fetchTopics(hub_id);
        setSuccess('נושא נוצר בהצלחה');
      }

      setCreateDialogOpen(false);
      setNewName('');
      setSelectedWorkspaceId('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.message || 'שגיאה ביצירה');
      showToast('שגיאה ביצירה', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (hub_id) {
      navigate(`/hub/${hub_id}/items`);
    } else {
      navigate('/items');
    }
  };

  if (loadingWorkspaces || loadingTopics) {
    return <Loading />;
  }

  const currentEntities = activeTab === 'workspaces' ? workspaces : topics;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">הגדרות</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={activeTab === 'workspaces' ? 'contained' : 'outlined'}
            startIcon={<BusinessIcon />}
            onClick={() => {
              setActiveTab('workspaces');
              setEditingId(null);
            }}
          >
            עולמות תוכן ({workspaces.length})
          </Button>
          <Button
            variant={activeTab === 'topics' ? 'contained' : 'outlined'}
            startIcon={<FolderSpecialIcon />}
            onClick={() => {
              setActiveTab('topics');
              setEditingId(null);
            }}
          >
            נושאים ({topics.length})
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            {activeTab === 'workspaces' ? 'צור עולם תוכן' : 'צור נושא'}
          </Button>
        </Box>
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
            {activeTab === 'workspaces' ? 'עולמות תוכן' : 'נושאים'} ({currentEntities.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>שם</TableCell>
                {activeTab === 'topics' && (
                  <TableCell sx={{ fontWeight: 700 }}>עולם תוכן</TableCell>
                )}
                <TableCell sx={{ fontWeight: 700 }}>פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentEntities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeTab === 'topics' ? 3 : 2} align="center">
                    אין {activeTab === 'workspaces' ? 'עולמות תוכן' : 'נושאים'} זמינים
                  </TableCell>
                </TableRow>
              ) : (
                currentEntities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      {editingId === entity.id ? (
                        <TextField
                          size="small"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit();
                            }
                          }}
                          sx={{ minWidth: 200 }}
                        />
                      ) : (
                        <Typography variant="body1">{entity.name}</Typography>
                      )}
                    </TableCell>
                    {activeTab === 'topics' && (
                      <TableCell>
                        {workspaces.find((w) => w.id === (entity as Topic).workspace_id)?.name || '-'}
                      </TableCell>
                    )}
                    <TableCell>
                      {editingId === entity.id ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={handleSaveEdit}
                            disabled={processing}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={handleCancelEdit}
                            disabled={processing}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleStartEdit(entity)}
                            title="ערוך"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(entity)}
                            title="מחק"
                          >
                            <DeleteIcon fontSize="small" />
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {activeTab === 'workspaces' ? 'צור עולם תוכן חדש' : 'צור נושא חדש'}
        </DialogTitle>
        <DialogContent>
          {activeTab === 'topics' && (
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>עולם תוכן</InputLabel>
              <Select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                label="עולם תוכן"
              >
                {workspaces.map((ws) => (
                  <MenuItem key={ws.id} value={ws.id}>
                    {ws.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            autoFocus
            fullWidth
            label={activeTab === 'workspaces' ? 'שם עולם התוכן' : 'שם הנושא'}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: activeTab === 'workspaces' ? 2 : 0 }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreate();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleCreate} variant="contained" disabled={processing || !newName.trim()}>
            {processing ? 'יוצר...' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setEntityToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={`מחיקת ${activeTab === 'workspaces' ? 'עולם תוכן' : 'נושא'}`}
        message={`האם אתה בטוח שברצונך למחוק את ${activeTab === 'workspaces' ? 'עולם התוכן' : 'הנושא'} "${entityToDelete?.name}"? פעולה זו לא ניתנת לביטול.`}
        severity="error"
      />
    </Container>
  );
}
