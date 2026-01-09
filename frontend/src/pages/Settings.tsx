import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Stack,
  Divider,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useClients } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import { Client, Project } from '../types';
import Loading from '../components/Common/Loading';

export default function Settings() {
  const { clients, loading: loadingClients, fetchClients, createClient, updateClient, deleteClient } = useClients();
  const { projects, loading: loadingProjects, fetchProjects, createProject, updateProject, deleteProject } = useProjects();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const [currentEntity, setCurrentEntity] = useState<Client | Project | null>(null);
  const [entityType, setEntityType] = useState<'client' | 'project'>('client');
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchProjects();
  }, []);

  // ✏️ פתיחת עריכה
  const handleEdit = (entity: Client | Project, type: 'client' | 'project') => {
    setCurrentEntity(entity);
    setEntityType(type);
    setEditName(entity.name);
    setEditDialogOpen(true);
  };

  // 💾 שמירת עריכה
  const handleSaveEdit = async () => {
    if (!currentEntity || !editName.trim()) return;

    setProcessing(true);
    try {
      if (entityType === 'client') {
        await updateClient(currentEntity.id, { name: editName.trim() });
      } else {
        await updateProject(currentEntity.id, { name: editName.trim(), client_id: (currentEntity as Project).client_id, status: (currentEntity as Project).status });
      }
      setEditDialogOpen(false);
      entityType === 'client' ? fetchClients() : fetchProjects();
    } catch (error) {
      console.error('Error updating:', error);
    }
    setProcessing(false);
  };

  // 🗑️ פתיחת מחיקה
  const handleDelete = (entity: Client | Project, type: 'client' | 'project') => {
    setCurrentEntity(entity);
    setEntityType(type);
    setDeleteDialogOpen(true);
  };

  // ✅ אישור מחיקה
  const handleConfirmDelete = async () => {
    if (!currentEntity) return;

    setProcessing(true);
    try {
      if (entityType === 'client') {
        await deleteClient(currentEntity.id);
        fetchClients();
      } else {
        await deleteProject(currentEntity.id);
        fetchProjects();
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting:', error);
    }
    setProcessing(false);
  };

  // ➕ פתיחת יצירה
  const handleCreate = (type: 'client' | 'project') => {
    setEntityType(type);
    setNewName('');
    setCreateDialogOpen(true);
  };

  // 💾 יצירה חדשה
  const handleSaveCreate = async () => {
    if (!newName.trim()) return;

    setProcessing(true);
    try {
      if (entityType === 'client') {
        await createClient({ name: newName.trim() });
        fetchClients();
      } else {
        // בשביל פרויקט, צריך לבחור לקוח
        if (clients.length > 0) {
          await createProject({ name: newName.trim(), client_id: clients[0].id, status: 'active' });
          fetchProjects();
        }
      }
      setCreateDialogOpen(false);
      setNewName('');
    } catch (error) {
      console.error('Error creating:', error);
    }
    setProcessing(false);
  };

  if (loadingClients || loadingProjects) {
    return <Loading />;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        הגדרות
      </Typography>

      {/* קטע לקוחות */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            לקוחות ({clients.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleCreate('client')}
          >
            לקוח חדש
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {clients.length === 0 ? (
          <Alert severity="info">אין לקוחות עדיין. לחץ על "לקוח חדש" כדי להוסיף.</Alert>
        ) : (
          <List>
            {clients.map((client) => (
              <React.Fragment key={client.id}>
                <ListItem
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    py: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1">{client.name}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(client, 'client')}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(client, 'client')}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* קטע פרויקטים */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            פרויקטים ({projects.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleCreate('project')}
          >
            פרויקט חדש
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {projects.length === 0 ? (
          <Alert severity="info">אין פרויקטים עדיין. לחץ על "פרויקט חדש" כדי להוסיף.</Alert>
        ) : (
          <List>
            {projects.map((project) => (
              <React.Fragment key={project.id}>
                <ListItem
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    py: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1">{project.name}</Typography>
                    {project.client && (
                      <Typography variant="body2" color="text.secondary">
                        לקוח: {project.client.name}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(project, 'project')}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(project, 'project')}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Dialog עריכה */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          עריכת {entityType === 'client' ? 'לקוח' : 'פרויקט'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={entityType === 'client' ? 'שם לקוח' : 'שם פרויקט'}
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveEdit();
              }
            }}
          />
        </DialogContent>
        <Stack direction="row" spacing={2} sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => setEditDialogOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={processing || !editName.trim()}
          >
            {processing ? 'שומר...' : 'שמור'}
          </Button>
        </Stack>
      </Dialog>

      {/* Dialog מחיקה */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>מחיקת {entityType === 'client' ? 'לקוח' : 'פרויקט'}</DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את {entityType === 'client' ? 'הלקוח' : 'הפרויקט'} "
            {currentEntity?.name}"?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            פעולה זו אינה ניתנת לביטול.
          </Typography>
        </DialogContent>
        <Stack direction="row" spacing={2} sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={processing}
          >
            {processing ? 'מוחק...' : 'מחק'}
          </Button>
        </Stack>
      </Dialog>

      {/* Dialog יצירה */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {entityType === 'client' ? 'לקוח חדש' : 'פרויקט חדש'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={entityType === 'client' ? 'שם לקוח' : 'שם פרויקט'}
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveCreate();
              }
            }}
          />
        </DialogContent>
        <Stack direction="row" spacing={2} sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => setCreateDialogOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            onClick={handleSaveCreate}
            disabled={processing || !newName.trim()}
          >
            {processing ? 'יוצר...' : 'צור'}
          </Button>
        </Stack>
      </Dialog>
    </Box>
  );
}
