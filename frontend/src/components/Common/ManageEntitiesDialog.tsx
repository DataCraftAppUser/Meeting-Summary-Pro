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
  Button,
  TextField,
  Stack,
  Divider,
  Typography,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Fade,
  Slide,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [currentEntity, setCurrentEntity] = useState<Client | Project | null>(null);
  const [entityType, setEntityType] = useState<'client' | 'project'>('client');
  const [processing, setProcessing] = useState(false);

  // ✏️ פתיחת עריכה inline
  const handleStartEdit = (entity: Client | Project) => {
    setEditingId(entity.id);
    setEditName(entity.name);
  };

  // ✅ שמירת עריכה inline
  const handleSaveEdit = async (entity: Client | Project, type: 'client' | 'project') => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }

    setProcessing(true);
    const success =
      type === 'client'
        ? await onClientEdit(entity.id, editName.trim())
        : await onProjectEdit(entity.id, editName.trim());
    setProcessing(false);

    if (success) {
      setEditingId(null);
      onUpdate();
    }
  };

  // ❌ ביטול עריכה
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
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
    setSelectedClientId(clients.length > 0 ? clients[0].id : '');
    setCreateDialogOpen(true);
  };

  // 💾 יצירה חדשה
  const handleSaveCreate = async () => {
    if (!newName.trim()) return;

    setProcessing(true);
    const success =
      tabValue === 0
        ? await onClientCreate(newName.trim())
        : await onProjectCreate(newName.trim(), selectedClientId);
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
    setEditingId(null);
  };

  return (
    <>
      {/* Dialog ראשי */}
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        fullWidth={false}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '85vh',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            width: '500px', // רוחב קבוע של 500px (קטן יותר)
            maxWidth: '90vw', // מקסימום 90% מהרוחב של המסך
          },
        }}
      >
        {/* כותרת מעוצבת */}
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2.5,
            px: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BusinessIcon sx={{ fontSize: 28 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              ניהול לקוחות ופרויקטים
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* טאבים מעוצבים */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: '#fafafa',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '0.95rem',
                fontWeight: 500,
                '&.Mui-selected': {
                  color: '#667eea',
                  fontWeight: 600,
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                backgroundColor: '#667eea',
              },
            }}
          >
            <Tab
              icon={<BusinessIcon sx={{ mb: 0.5 }} />}
              iconPosition="start"
              label={`לקוחות (${clients.length})`}
            />
            <Tab
              icon={<FolderSpecialIcon sx={{ mb: 0.5 }} />}
              iconPosition="start"
              label={`פרויקטים (${projects.length})`}
            />
          </Tabs>
        </Box>

        {/* תוכן */}
        <DialogContent sx={{ p: 0, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* טאב לקוחות */}
          {tabValue === 0 && (
            <Slide direction="left" in={tabValue === 0} mountOnEnter unmountOnExit>
              <Box>
                {clients.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography color="text.secondary" variant="body1">
                      אין לקוחות עדיין
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                      לחץ על "לקוח חדש" כדי להתחיל
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ pt: 0 }}>
                    {clients.map((client, index) => (
                      <React.Fragment key={client.id}>
                        <ListItem
                          sx={{
                            py: 2.5,
                            px: 3,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                            },
                          }}
                        >
                          {editingId === client.id ? (
                            // מצב עריכה
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                              <TextField
                                autoFocus
                                fullWidth
                                size="small"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveEdit(client, 'client');
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'white',
                                  },
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleSaveEdit(client, 'client')}
                                disabled={processing || !editName.trim()}
                                sx={{
                                  color: 'success.main',
                                  '&:hover': { backgroundColor: 'rgba(46, 125, 50, 0.1)' },
                                }}
                              >
                                <CheckIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={handleCancelEdit}
                                disabled={processing}
                                sx={{
                                  color: 'error.main',
                                  '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' },
                                }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Box>
                          ) : (
                            // מצב תצוגה
                            <>
                              <Box
                                sx={{
                                  flex: 1,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.7,
                                  },
                                }}
                                onClick={() => handleStartEdit(client)}
                              >
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {client.name}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleStartEdit(client)}
                                  sx={{
                                    color: 'primary.main',
                                    '&:hover': {
                                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(client, 'client')}
                                  sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </>
                          )}
                        </ListItem>
                        {index < clients.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
                <Box sx={{ p: 2.5, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    fullWidth
                    sx={{
                      backgroundColor: '#667eea',
                      '&:hover': {
                        backgroundColor: '#5568d3',
                      },
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    לקוח חדש
                  </Button>
                </Box>
              </Box>
            </Slide>
          )}

          {/* טאב פרויקטים */}
          {tabValue === 1 && (
            <Slide direction="right" in={tabValue === 1} mountOnEnter unmountOnExit>
              <Box>
                {projects.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <FolderSpecialIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography color="text.secondary" variant="body1">
                      אין פרויקטים עדיין
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                      לחץ על "פרויקט חדש" כדי להתחיל
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ pt: 0 }}>
                    {projects.map((project, index) => (
                      <React.Fragment key={project.id}>
                        <ListItem
                          sx={{
                            py: 2.5,
                            px: 3,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: '#f5f5f5',
                            },
                          }}
                        >
                          {editingId === project.id ? (
                            // מצב עריכה
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                              <TextField
                                autoFocus
                                fullWidth
                                size="small"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveEdit(project, 'project');
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'white',
                                  },
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleSaveEdit(project, 'project')}
                                disabled={processing || !editName.trim()}
                                sx={{
                                  color: 'success.main',
                                  '&:hover': { backgroundColor: 'rgba(46, 125, 50, 0.1)' },
                                }}
                              >
                                <CheckIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={handleCancelEdit}
                                disabled={processing}
                                sx={{
                                  color: 'error.main',
                                  '&:hover': { backgroundColor: 'rgba(211, 47, 47, 0.1)' },
                                }}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Box>
                          ) : (
                            // מצב תצוגה
                            <>
                              <Box
                                sx={{
                                  flex: 1,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.7,
                                  },
                                }}
                                onClick={() => handleStartEdit(project)}
                              >
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {project.name}
                                </Typography>
                                {project.client && (
                                  <Chip
                                    label={project.client.name}
                                    size="small"
                                    sx={{
                                      mt: 0.5,
                                      height: 20,
                                      fontSize: '0.7rem',
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                    }}
                                  />
                                )}
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleStartEdit(project)}
                                  sx={{
                                    color: 'primary.main',
                                    '&:hover': {
                                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                    },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(project, 'project')}
                                  sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                      backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </>
                          )}
                        </ListItem>
                        {index < projects.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
                <Box sx={{ p: 2.5, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    fullWidth
                    sx={{
                      backgroundColor: '#667eea',
                      '&:hover': {
                        backgroundColor: '#5568d3',
                      },
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    פרויקט חדש
                  </Button>
                </Box>
              </Box>
            </Slide>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog מחיקה */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            direction: 'rtl',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          מחיקת {entityType === 'client' ? 'לקוח' : 'פרויקט'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את {entityType === 'client' ? 'הלקוח' : 'הפרויקט'} "
            {currentEntity?.name}"?
          </Typography>
          <Typography color="error" sx={{ mt: 1, fontSize: '0.9rem' }}>
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
          sx: {
            borderRadius: 2,
            direction: 'rtl',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
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
            sx={{ mb: tabValue === 1 ? 2 : 0 }}
          />
          {tabValue === 1 && (
            <FormControl fullWidth margin="dense">
              <InputLabel>לקוח</InputLabel>
              <Select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                label="לקוח"
              >
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <Stack direction="row" spacing={2} sx={{ p: 2, justifyContent: 'flex-end' }}>
          <Button onClick={() => setCreateDialogOpen(false)}>ביטול</Button>
          <Button
            variant="contained"
            onClick={handleSaveCreate}
            disabled={processing || !newName.trim() || (tabValue === 1 && !selectedClientId)}
            sx={{
              backgroundColor: '#667eea',
              '&:hover': {
                backgroundColor: '#5568d3',
              },
            }}
          >
            {processing ? 'יוצר...' : 'צור'}
          </Button>
        </Stack>
      </Dialog>
    </>
  );
}
