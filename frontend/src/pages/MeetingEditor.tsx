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
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import MeetingForm from '../components/Meetings/MeetingForm';
import Loading from '../components/Common/Loading';
import { useMeetings } from '../hooks/useMeetings';
import { useClients } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import { useToast } from '../hooks/useToast';
import { MeetingFormData } from '../types';

const MeetingEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMeeting, createMeeting, updateMeeting } = useMeetings();
  const { clients, fetchClients, createClient } = useClients();
  const { projects, fetchProjects, createProject } = useProjects();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    content: '',
    status: 'draft',
  });

  // Client Dialog
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  // Project Dialog
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // ✅ פונקציית עזר להמרת HTML לטקסט עם שמירת פורמט
  const cleanHTMLToText = (html: string): string => {
    if (!html) return '';
    
    // החלף תגיות HTML בשורות חדשות ופורמט
    let text = html
      // פסקאות וכותרות
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      
      // שורות חדשות
      .replace(/<br\s*\/?>/gi, '\n')
      
      // פריטי רשימה
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      
      // הסר את שאר התגיות
      .replace(/<[^>]+>/g, '')
      
      // תווים מיוחדים של HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      
      // נקה רווחים מיותרים
      .replace(/\n{3,}/g, '\n\n') // לא יותר משתי שורות ריקות
      .trim();
    
    return text;
  };

  // ✅ טעינת נתונים ראשונית
  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // ✅ טען לקוחות ופרויקטים במקביל
      await Promise.all([
        fetchClients(),
        fetchProjects(),
      ]);

      // ✅ אם יש ID תקין (לא "new" ולא undefined), טען את הסיכום
      if (id && id !== 'new' && id !== 'undefined' && id.trim() !== '') {
        console.log('📝 Loading meeting for edit, ID:', id);
        
        try {
          const response = await getMeeting(id);
          console.log('📦 Meeting response:', response);
          
          // ✅ טיפול בפורמטים שונים של response
          const meeting = (response as any)?.data || response;
          console.log('✅ Meeting data:', meeting);
          
          if (meeting && meeting.id) {
            // ✅ נקה HTML tags מהתוכן אך שמור על פורמט
            let cleanContent = meeting.content || '';
            
            // ✅ אם יש full_raw_content, השתמש בו (טקסט מקורי ללא HTML)
            if (meeting.full_raw_content) {
              cleanContent = cleanHTMLToText(meeting.full_raw_content);
            } else if (meeting.content && meeting.content.includes('<')) {
              // אם אין full_raw_content אבל יש HTML ב-content, נקה אותו
              cleanContent = cleanHTMLToText(meeting.content);
            }
            
            setFormData({
              client_id: meeting.client_id || undefined,
              project_id: meeting.project_id || undefined,
              title: meeting.title || '',
              meeting_date: meeting.meeting_date || new Date().toISOString().split('T')[0],
              meeting_time: meeting.meeting_time || undefined,
              participants: meeting.participants || [],
              content: cleanContent.trim(),  // ✅ טקסט נקי עם פורמט
              action_items: meeting.action_items || [],
              follow_up_required: meeting.follow_up_required || false,
              follow_up_date: meeting.follow_up_date || undefined,
              follow_up_time: meeting.follow_up_time || undefined,
              follow_up_tbd: meeting.follow_up_tbd || false,
              status: (meeting.status === 'processing' || meeting.status === 'processed') 
                ? 'draft' 
                : (meeting.status || 'draft'),
            });
            
            console.log('✅ Form data set successfully');
            console.log('📄 Clean content length:', cleanContent.trim().length);
          } else {
            console.warn('⚠️ Meeting data is invalid:', meeting);
            showToast('לא נמצא סיכום לעריכה', 'error');
            navigate('/meetings');
          }
        } catch (meetingError) {
          console.error('❌ Error loading meeting:', meetingError);
          showToast('שגיאה בטעינת הסיכום', 'error');
          navigate('/meetings');
        }
      } else {
        console.log('🆕 Creating new meeting (no ID or ID is "new")');
      }
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      showToast('שגיאה בטעינת הנתונים', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ יצירת לקוח חדש
  const handleClientCreate = async () => {
    if (!newClientName.trim()) {
      showToast('נא להזין שם לקוח', 'warning');
      return;
    }

    try {
      setCreatingClient(true);
      const newClient = await createClient({ name: newClientName.trim() });
      
      if (newClient) {
        await fetchClients();
        setFormData(prev => ({ ...prev, client_id: newClient.id }));
        setClientDialogOpen(false);
        setNewClientName('');
        showToast('לקוח נוצר בהצלחה', 'success');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      showToast('שגיאה ביצירת לקוח', 'error');
    } finally {
      setCreatingClient(false);
    }
  };

  // ✅ יצירת פרויקט חדש
  const handleProjectCreate = async () => {
    if (!newProjectName.trim()) {
      showToast('נא להזין שם פרויקט', 'warning');
      return;
    }

    if (!formData.client_id) {
      showToast('נא לבחור לקוח תחילה', 'warning');
      return;
    }

    try {
      setCreatingProject(true);
      const newProject = await createProject({
        name: newProjectName.trim(),
        client_id: formData.client_id,
        status: 'active',
      });
      
      if (newProject) {
        await fetchProjects();
        setFormData(prev => ({ ...prev, project_id: newProject.id }));
        setProjectDialogOpen(false);
        setNewProjectName('');
        showToast('פרויקט נוצר בהצלחה', 'success');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      showToast('שגיאה ביצירת פרויקט', 'error');
    } finally {
      setCreatingProject(false);
    }
  };

  // ✅ שינוי בטופס
  const handleFormChange = (data: Partial<MeetingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // ✅ שמירת הסיכום
  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast('נא להזין כותרת לסיכום', 'warning');
      return;
    }

    if (!formData.content.trim()) {
      showToast('נא להזין תוכן לסיכום', 'warning');
      return;
    }

    try {
      setSaving(true);

      if (id && id !== 'new' && id !== 'undefined') {
        // עדכון סיכום קיים
        await updateMeeting(id, formData);
        showToast('הסיכום עודכן בהצלחה', 'success');
        navigate(`/meetings/${id}`);
      } else {
        // יצירת סיכום חדש
        console.log('🆕 Creating new meeting with data:', formData);
        const newMeeting = await createMeeting(formData);
        
        console.log('✅ New meeting response:', newMeeting);
        
        if (newMeeting && newMeeting.id) {
          showToast('הסיכום נשמר בהצלחה', 'success');
          console.log('✅ Navigating to:', `/meetings/${newMeeting.id}`);
          
          // ✅ השהיה קטנה כדי לוודא שה-DB התעדכן
          setTimeout(() => {
            navigate(`/meetings/${newMeeting.id}`);
          }, 500);
        } else {
          showToast('הסיכום נשמר, אבל לא ניתן לפתוח אותו', 'warning');
          console.error('❌ newMeeting.id is missing:', newMeeting);
          navigate('/meetings');
        }
      }
    } catch (error: any) {
      console.error('❌ Error saving meeting:', error);
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
          <IconButton onClick={() => navigate('/meetings')} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5">
            {id && id !== 'new' ? 'עריכת סיכום' : 'סיכום חדש'}
          </Typography>
        </Box>
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
      <MeetingForm
        formData={formData}
        clients={clients}
        projects={projects}
        onChange={handleFormChange}
        onCreateClient={() => setClientDialogOpen(true)}
        onCreateProject={() => setProjectDialogOpen(true)}
      />

      {/* Client Dialog */}
      <Dialog open={clientDialogOpen} onClose={() => setClientDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>צור לקוח חדש</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="שם הלקוח"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            sx={{ mt: 2 }}
            dir="rtl"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleClientCreate} variant="contained" disabled={creatingClient}>
            {creatingClient ? 'יוצר...' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>צור פרויקט חדש</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="שם הפרויקט"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            sx={{ mt: 2 }}
            dir="rtl"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectDialogOpen(false)}>ביטול</Button>
          <Button onClick={handleProjectCreate} variant="contained" disabled={creatingProject}>
            {creatingProject ? 'יוצר...' : 'צור'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingEditor;
