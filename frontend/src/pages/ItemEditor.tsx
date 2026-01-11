import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import ItemForm from '../components/Items/ItemForm';
import Loading from '../components/Common/Loading';
import { useItems } from '../hooks/useItems';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useTopics } from '../hooks/useTopics';
import { useToast } from '../hooks/useToast';
import { ItemFormData } from '../types';

const ItemEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getItem, createItem, updateItem } = useItems();
  const { workspaces, fetchWorkspaces, createWorkspace } = useWorkspaces();
  const { topics, fetchTopics, createTopic } = useTopics();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ItemFormData>({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    content: '',
    content_type: 'knowledge_item',
    status: 'draft',
  });

  // Workspace Dialog
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  // Topic Dialog
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  // ✅ טעינת נתונים ראשונית
  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // ✅ טען workspaces ו-topics במקביל
      await Promise.all([
        fetchWorkspaces(),
        fetchTopics(),
      ]);

      // ✅ אם יש ID תקין (לא "new" ולא undefined), טען את הפריט
      if (id && id !== 'new' && id !== 'undefined' && id.trim() !== '') {
        console.log('📝 Loading item for edit, ID:', id);
        
        try {
          const response = await getItem(id);
          console.log('📦 Item response:', response);
          
          // ✅ טיפול בפורמטים שונים של response
          const item = (response as any)?.data || response;
          console.log('✅ Item data:', item);
          
          if (item && item.id) {
            // ✅ טעינת תוכן חכמה: העדפת השדה הארוך ביותר מבין השניים
            // בפריטים ישנים המידע המלא עשוי להיות ב-full_raw_content
            const rawContent = item.content || '';
            const fullContent = item.full_raw_content || '';
            
            let contentToEdit = (fullContent.length > rawContent.length) ? fullContent : rawContent;
            
            // ניקוי עטיפות div בלבד (ללא חיתוך תוכן)
            contentToEdit = contentToEdit
              .replace(/^<div dir="rtl"[^>]*><div[^>]*>/i, '')
              .replace(/<div dir="rtl">/i, '')
              .replace(/<\/div><\/div>$/i, '')
              .replace(/<\/div>$/i, '')
              .trim();
            
            setFormData({
              workspace_id: item.workspace_id || undefined,
              topic_id: item.topic_id || undefined,
              title: item.title || '',
              meeting_date: item.meeting_date || new Date().toISOString().split('T')[0],
              meeting_time: item.meeting_time || undefined,
              participants: item.participants || [],
              content_type: item.content_type || 'meeting',
              content: contentToEdit,
              action_items: item.action_items || [],
              follow_up_required: item.follow_up_required || false,
              follow_up_date: item.follow_up_date || undefined,
              follow_up_time: item.follow_up_time || undefined,
              follow_up_tbd: item.follow_up_tbd || false,
              status: (item.status === 'processing' || item.status === 'processed') 
                ? 'draft' 
                : (item.status || 'draft'),
            });
            
            console.log('✅ Form data set successfully');
            console.log('📄 Content length:', contentToEdit.trim().length);
          } else {
            console.warn('⚠️ Item data is invalid:', item);
            showToast('לא נמצא פריט לעריכה', 'error');
            navigate('/items');
          }
        } catch (itemError) {
          console.error('❌ Error loading item:', itemError);
          showToast('שגיאה בטעינת הפריט', 'error');
          navigate('/items');
        }
      } else {
        console.log('🆕 Creating new item (no ID or ID is "new")');
      }
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      showToast('שגיאה בטעינת הנתונים', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ יצירת עולם תוכן חדש
  const handleWorkspaceCreate = async () => {
    if (!newWorkspaceName.trim()) {
      showToast('נא להזין שם עולם תוכן', 'warning');
      return;
    }

    try {
      setCreatingWorkspace(true);
      const newWorkspace = await createWorkspace({ name: newWorkspaceName.trim() });
      
      if (newWorkspace) {
        await fetchWorkspaces();
        setFormData(prev => ({ ...prev, workspace_id: newWorkspace.id }));
        setWorkspaceDialogOpen(false);
        setNewWorkspaceName('');
        showToast('עולם תוכן נוצר בהצלחה', 'success');
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      showToast('שגיאה ביצירת עולם תוכן', 'error');
    } finally {
      setCreatingWorkspace(false);
    }
  };

  // ✅ יצירת נושא חדש
  const handleTopicCreate = async () => {
    if (!newTopicName.trim()) {
      showToast('נא להזין שם נושא/פרויקט', 'warning');
      return;
    }

    if (!formData.workspace_id) {
      showToast('נא לבחור עולם תוכן תחילה', 'warning');
      return;
    }

    try {
      setCreatingTopic(true);
      const newTopic = await createTopic({
        name: newTopicName.trim(),
        workspace_id: formData.workspace_id,
        status: 'active',
      });
      
      if (newTopic) {
        await fetchTopics();
        setFormData(prev => ({ ...prev, topic_id: newTopic.id }));
        setTopicDialogOpen(false);
        setNewTopicName('');
        showToast('נושא נוצר בהצלחה', 'success');
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      showToast('שגיאה ביצירת נושא', 'error');
    } finally {
      setCreatingTopic(false);
    }
  };

  // ✅ שינוי בטופס
  const handleFormChange = (data: Partial<ItemFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // ✅ שמירת הפריט
  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast('נא להזין כותרת לפריט', 'warning');
      return;
    }

    if (!formData.content.trim()) {
      showToast('נא להזין תוכן לפריט', 'warning');
      return;
    }

    try {
      setSaving(true);

      if (id && id !== 'new' && id !== 'undefined') {
        // עדכון פריט קיים
        await updateItem(id, formData);
        showToast('הפריט עודכן בהצלחה', 'success');
        navigate(`/items/${id}`);
      } else {
        // יצירת פריט חדש
        console.log('🆕 Creating new item with data:', formData);
        const newItem = await createItem(formData);
        
        console.log('✅ New item response:', newItem);
        
        if (newItem && newItem.id) {
          showToast('הפריט נשמר בהצלחה', 'success');
          console.log('✅ Navigating to:', `/items/${newItem.id}`);
          
          // ✅ השהיה קטנה כדי לוודא שה-DB התעדכן
          setTimeout(() => {
            navigate(`/items/${newItem.id}`);
          }, 500);
        } else {
          showToast('הפריט נשמר, אבל לא ניתן לפתוח אותו', 'warning');
          console.error('❌ newItem.id is missing:', newItem);
          navigate('/items');
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving item:', error);
      showToast(error.message || 'שגיאה בשמירת נתונים', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading message="טוען נתונים..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/items')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">
            {id && id !== 'new' ? 'עריכת תוכן' : 'תוכן חדש'}
          </Typography>
        </Box>

        <ToggleButtonGroup
          value={formData.content_type || 'knowledge_item'}
          exclusive
          onChange={(_, newValue) => {
            if (newValue) {
              handleFormChange({ content_type: newValue });
            }
          }}
          size="small"
          color="primary"
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              px: 3,
              py: 0.5,
              fontWeight: 600,
            }
          }}
        >
          <ToggleButton value="meeting">סיכום פגישה</ToggleButton>
          <ToggleButton value="knowledge_item">פריט ידע</ToggleButton>
          <ToggleButton value="work_log">יומן עבודה</ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'שומר...' : 'שמור'}
        </Button>
      </Paper>

      {/* Form */}
      <ItemForm
        formData={formData}
        workspaces={workspaces}
        topics={topics}
        onChange={handleFormChange}
        onCreateWorkspace={() => setWorkspaceDialogOpen(true)}
        onCreateTopic={() => setTopicDialogOpen(true)}
      />

      {/* Workspace Dialog */}
      <Dialog open={workspaceDialogOpen} onClose={() => setWorkspaceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>צור עולם תוכן/לקוח חדש</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="שם עולם התוכן"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            sx={{ mt: 2 }}
            dir="rtl"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkspaceDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleWorkspaceCreate} variant="contained" disabled={creatingWorkspace}>
            {creatingWorkspace ? 'יוצר...' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Topic Dialog */}
      <Dialog open={topicDialogOpen} onClose={() => setTopicDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>צור נושא/פרויקט חדש</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="שם הנושא/פרויקט"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            sx={{ mt: 2 }}
            dir="rtl"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopicDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleTopicCreate} variant="contained" disabled={creatingTopic}>
            {creatingTopic ? 'יוצר...' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemEditor;
