import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Stack,
  Divider,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Client, Project } from '../../types';

interface ManageEntitiesDialogProps {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  projects: Project[];
  onClientEdit: (id: string, name: string) => Promise<boolean>;
  onClientDelete: (id: string) => Promise<boolean>;
  onClientCreate: (name: string) => Promise<boolean>;
  onProjectEdit: (id: string, name: string) => Promise<boolean>;
  onProjectDelete: (id: string) => Promise<boolean>;
  onProjectCreate: (name: string, clientId: string) => Promise<boolean>;
  onUpdate: () => void;
}

export default function ManageEntitiesDialog({
  open,
  onClose,
  clients,
  projects,
  onClientEdit,
  onClientDelete,
  onClientCreate,
  onProjectEdit,
  onProjectDelete,
  onProjectCreate,
  onUpdate,
}: ManageEntitiesDialogProps) {
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<Client | Project | null>(null);
  const [entityType, setEntityType] = useState<'client' | 'project'>('client');
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [processing, setProcessing] = useState(false);

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
    const success =
      entityType === 'client'
        ? await onClientEdit(currentEntity.id, editName.trim())
        : await onProjectEdit(currentEntity.id, editName.trim());
    setProcessing(false);

    if (success) {
      setEditDialogOpen(false);
      onUpdate();
    }
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
    const success =
      entityType === 'client'
        ? await onClientDelete(currentEntity.id)
        : await onProjectDelete(currentEntity.id);
    setProcessing(false);

    if (success) {
      setDeleteDialogOpen(false);
      onUpdate();
    }
  };

  // ➕ פתיחת יצירה
  const handleCreate = () => {
    setNewName('');
    setCreateDialogOpen(true);
  };

  // 💾 יצירה חדשה
  const handleSaveCreate = async () => {
    if (!newName.trim()) return;

    setProcessing(true);
    const success =
      tabValue === 0
        ? await onClientCreate(newName.trim())
        : await onProjectCreate(newName.trim(), ''); // נצטרך לבחור לקוח
    setProcessing(false);

    if (success) {
      setCreateDialogOpen(false);
      setNewName('');
      onUpdate();
    }
  };

  // 🔄 החלפת טאב
  const handleTabChange = (_: any, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      {/* Dialog ראשי */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            minHeight: '400px',
            maxHeight: '70vh',
          },
        }}
      >
        {/* כותרת */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Typography variant="h6" component="div">
            ניהול לקוחות ופרויקטים
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* טאבים */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label={`📋 לקוחות (${clients.length})`} />
            <Tab label={`📁 פרויקטים (${projects.length})`} />
          </Tabs>
        </Box>

        {/* תוכן */}
        <DialogContent sx={{ p: 0 }}>
          {/* טאב לקוחות */}
          {tabValue === 0 && (
            <Box>
              <List sx={{ pt: 0 }}>
                {clients.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">אין לקוחות עדיין</Typography>
                  </Box>
                ) : (
                  clients.map((client) => (
                    <React.Fragment key={client.id}>
                      <ListItem
                        dir="ltr"
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          py: 1.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
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
                        <Box sx={{ flex: 1, textAlign: 'right', pr: 2 }}>
                          <Typography variant="body1">{client.name}</Typography>
                        </Box>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                )}
              </List>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleCreate}
                  fullWidth
                >
                  לקוח חדש
                </Button>
              </Box>
            </Box>
          )}

          {/* טאב פרויקטים */}
          {tabValue === 1 && (
            <Box>
              <List sx={{ pt: 0 }}>
                {projects.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">אין פרויקטים עדיין</Typography>
                  </Box>
                ) : (
                  projects.map((project) => (
                    <React.Fragment key={project.id}>
                      <ListItem
                        dir="ltr"
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          py: 1.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
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
                        <Box sx={{ flex: 1, textAlign: 'right', pr: 2 }}>
                          <Typography variant="body1">{project.name}</Typography>
                          {project.client && (
                            <Typography variant="body2" color="text.secondary">
                              לקוח: {project.client.name}
                            </Typography>
                          )}
                        </Box>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                )}
              </List>
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleCreate}
                  fullWidth
                >
                  פרויקט חדש
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog עריכה */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: { direction: 'rtl' }
        }}
      >
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
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: { direction: 'rtl' }
        }}
      >
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
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: { direction: 'rtl' }
        }}
      >
        <DialogTitle>
          {tabValue === 0 ? 'לקוח חדש' : 'פרויקט חדש'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={tabValue === 0 ? 'שם לקוח' : 'שם פרויקט'}
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
    </>
  );
}
