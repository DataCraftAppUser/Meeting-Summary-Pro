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
import { Workspace, Topic } from '../../types';

interface ManageEntitiesDialogProps {
  open: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  topics: Topic[];
  onWorkspaceEdit: (id: string, name: string) => Promise<boolean>;
  onWorkspaceDelete: (id: string) => Promise<boolean>;
  onWorkspaceCreate: (name: string) => Promise<boolean>;
  onTopicEdit: (id: string, name: string) => Promise<boolean>;
  onTopicDelete: (id: string) => Promise<boolean>;
  onTopicCreate: (name: string, workspaceId: string) => Promise<boolean>;
  onUpdate: () => void;
}

export default function ManageEntitiesDialog({
  open,
  onClose,
  workspaces,
  topics,
  onWorkspaceEdit,
  onWorkspaceDelete,
  onWorkspaceCreate,
  onTopicEdit,
  onTopicDelete,
  onTopicCreate,
  onUpdate,
}: ManageEntitiesDialogProps) {
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [currentEntity, setCurrentEntity] = useState<Workspace | Topic | null>(null);
  const [entityType, setEntityType] = useState<'workspace' | 'topic'>('workspace');
  const [processing, setProcessing] = useState(false);

  // ✏️ פתיחת עריכה inline
  const handleStartEdit = (entity: Workspace | Topic) => {
    setEditingId(entity.id);
    setEditName(entity.name);
  };

  // ✅ שמירת עריכה inline
  const handleSaveEdit = async (entity: Workspace | Topic, type: 'workspace' | 'topic') => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }

    setProcessing(true);
    const success =
      type === 'workspace'
        ? await onWorkspaceEdit(entity.id, editName.trim())
        : await onTopicEdit(entity.id, editName.trim());
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
  const handleDelete = (entity: Workspace | Topic, type: 'workspace' | 'topic') => {
    setCurrentEntity(entity);
    setEntityType(type);
    setDeleteDialogOpen(true);
  };

  // ✅ אישור מחיקה
  const handleConfirmDelete = async () => {
    if (!currentEntity) return;

    setProcessing(true);
    const success =
      entityType === 'workspace'
        ? await onWorkspaceDelete(currentEntity.id)
        : await onTopicDelete(currentEntity.id);
    setProcessing(false);

    if (success) {
      setDeleteDialogOpen(false);
      onUpdate();
    }
  };

  // ➕ פתיחת יצירה
  const handleCreate = () => {
    setNewName('');
    setSelectedWorkspaceId(workspaces.length > 0 ? workspaces[0].id : '');
    setCreateDialogOpen(true);
  };

  // 💾 יצירה חדשה
  const handleSaveCreate = async () => {
    if (!newName.trim()) return;

    setProcessing(true);
    const success =
      tabValue === 0
        ? await onWorkspaceCreate(newName.trim())
        : await onTopicCreate(newName.trim(), selectedWorkspaceId);
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
            background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
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
              ניהול Workspaces ונושאים
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
                  color: 'primary.main',
                  fontWeight: 600,
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                backgroundColor: 'primary.main',
              },
            }}
          >
            <Tab
              icon={<BusinessIcon sx={{ mb: 0.5 }} />}
              iconPosition="start"
              label={`Workspaces (${workspaces.length})`}
            />
            <Tab
              icon={<FolderSpecialIcon sx={{ mb: 0.5 }} />}
              iconPosition="start"
              label={`נושאים (${topics.length})`}
            />
          </Tabs>
        </Box>

        {/* תוכן */}
        <DialogContent sx={{ p: 0, maxHeight: '60vh', overflowY: 'auto' }}>
          {/* טאב Workspaces */}
          {tabValue === 0 && (
            <Slide direction="left" in={tabValue === 0} mountOnEnter unmountOnExit>
              <Box>
                {workspaces.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography color="text.secondary" variant="body1">
                      אין Workspaces עדיין
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                      לחץ על "Workspace חדש" כדי להתחיל
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ pt: 0 }}>
                    {workspaces.map((workspace, index) => (
                      <React.Fragment key={workspace.id}>
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
                          {editingId === workspace.id ? (
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
                                    handleSaveEdit(workspace, 'workspace');
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
                                onClick={() => handleSaveEdit(workspace, 'workspace')}
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
                                onClick={() => handleStartEdit(workspace)}
                              >
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {workspace.name}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleStartEdit(workspace)}
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
                                  onClick={() => handleDelete(workspace, 'workspace')}
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
                        {index < workspaces.length - 1 && <Divider />}
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
                      backgroundColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Workspace חדש
                  </Button>
                </Box>
              </Box>
            </Slide>
          )}

          {/* טאב נושאים */}
          {tabValue === 1 && (
            <Slide direction="right" in={tabValue === 1} mountOnEnter unmountOnExit>
              <Box>
                {topics.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <FolderSpecialIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                    <Typography color="text.secondary" variant="body1">
                      אין נושאים עדיין
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                      לחץ על "נושא חדש" כדי להתחיל
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ pt: 0 }}>
                    {topics.map((topic, index) => (
                      <React.Fragment key={topic.id}>
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
                          {editingId === topic.id ? (
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
                                    handleSaveEdit(topic, 'topic');
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
                                onClick={() => handleSaveEdit(topic, 'topic')}
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
                                onClick={() => handleStartEdit(topic)}
                              >
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  {topic.name}
                                </Typography>
                                {topic.workspaces && (
                                  <Chip
                                    label={topic.workspaces.name}
                                    size="small"
                                    sx={{
                                      mt: 0.5,
                                      height: 20,
                                      fontSize: '0.7rem',
                                      backgroundColor: 'secondary.light',
                                      color: 'secondary.dark',
                                    }}
                                  />
                                )}
                              </Box>
                              <Stack direction="row" spacing={0.5}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleStartEdit(topic)}
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
                                  onClick={() => handleDelete(topic, 'topic')}
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
                        {index < topics.length - 1 && <Divider />}
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
                      backgroundColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  >
                    נושא חדש
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
          מחיקת {entityType === 'workspace' ? 'Workspace' : 'נושא'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            האם אתה בטוח שברצונך למחוק את {entityType === 'workspace' ? 'ה-Workspace' : 'הנושא'} "
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
          {tabValue === 0 ? 'Workspace חדש' : 'נושא חדש'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={tabValue === 0 ? 'שם Workspace' : 'שם נושא'}
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
              <InputLabel>Workspace</InputLabel>
              <Select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                label="Workspace"
              >
                {workspaces.map((workspace) => (
                  <MenuItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
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
            disabled={processing || !newName.trim() || (tabValue === 1 && !selectedWorkspaceId)}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
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
