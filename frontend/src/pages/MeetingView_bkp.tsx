import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Translate as TranslateIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { useMeetings } from '../hooks/useMeetings';
import { useToast } from '../hooks/useToast';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import Loading from '../components/Common/Loading';

const MeetingView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMeeting, processMeeting, translateMeeting } = useMeetings();
  const { showToast } = useToast();

  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [viewMode, setViewMode] = useState<'raw' | 'processed'>('raw');

  useEffect(() => {
    loadMeeting();
  }, [id]);

  const loadMeeting = async () => {
    if (!id) return;

    setLoading(true);
    try {
      console.log('📥 Loading meeting:', id);
      const data = await getMeeting(id);
      console.log('✅ Meeting loaded:', data);
      
      if (data) {
        setMeeting(data);
        
        // אם יש processed_content, הצג אותו
        if (data.processed_content) {
          setViewMode('processed');
        }
      }
    } catch (error) {
      console.error('❌ Error loading meeting:', error);
      showToast('שגיאה בטעינת הסיכום', 'error');
      navigate('/meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!meeting) return;

    setProcessing(true);
    try {
      console.log('🤖 Starting process for meeting:', meeting.id);
      
      // עיבוד
      await processMeeting(meeting.id, meeting.content);
      
      console.log('✅ Process completed, reloading meeting...');
      
      // טען מחדש את הסיכום מהשרת
      await loadMeeting();
      
      // עבור לגרסה מעובדת
      setViewMode('processed');
      
      showToast('הסיכום עובד בהצלחה', 'success');
    } catch (error) {
      console.error('❌ Error in handleProcess:', error);
      showToast('שגיאה בעיבוד הסיכום', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleTranslate = async () => {
    if (!meeting) return;

    setTranslating(true);
    try {
      const result = await translateMeeting(meeting.id, 'en');
      
      if (!result) {
        throw new Error('Translation failed');
      }
      
      // פתח חלון חדש עם התרגום
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html dir="ltr" lang="en">
          <head>
            <meta charset="UTF-8">
            <title>${meeting.title} - Translation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.8; padding: 20px; direction: ltr; text-align: left; }
            </style>
          </head>
          <body>
            ${result.content || result}
          </body>
          </html>
        `);
        newWindow.document.close();
      }
      
      showToast('התרגום הושלם', 'success');
    } catch (error) {
      console.error('❌ Translation error:', error);
      showToast('שגיאה בתרגום הסיכום', 'error');
    } finally {
      setTranslating(false);
    }
  };

  const handleCopy = () => {
    if (!meeting) return;

    const content = viewMode === 'raw'
      ? (meeting as any).full_raw_content || meeting.content
      : meeting.processed_content || meeting.content;

    if (!content) {
      showToast('אין תוכן להעתקה', 'warning');
      return;
    }

    try {
      // ✅ שיטה עם contentEditable - עובדת מעולה!
      const tempDiv = document.createElement('div');
      tempDiv.contentEditable = 'true';
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '1px';
      tempDiv.style.height = '1px';
      tempDiv.style.opacity = '0';
      tempDiv.innerHTML = content;
      document.body.appendChild(tempDiv);

      // בחר את כל התוכן
      tempDiv.focus();
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // העתק
      const success = document.execCommand('copy');

      // נקה
      if (selection) {
        selection.removeAllRanges();
      }
      document.body.removeChild(tempDiv);

      if (success) {
        showToast('הועתק ללוח עם עיצוב מלא', 'success');
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      console.error('❌ Copy error:', err);
      showToast('שגיאה בהעתקה', 'error');
    }
  };

  if (loading) {
    return <Loading message="טוען סיכום..." />;
  }

  if (!meeting) {
    return (
      <Container>
        <Typography>הסיכום לא נמצא</Typography>
      </Container>
    );
  }

  const content = viewMode === 'raw'
    ? (meeting as any).full_raw_content || meeting.content
    : meeting.processed_content || meeting.content;

  console.log('🎨 Rendering content:', {
    viewMode,
    hasContent: !!content,
    contentLength: content?.length,
    contentPreview: content?.substring(0, 100)
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            {meeting.title}
          </Typography>
          <IconButton onClick={() => navigate(`/meetings/${id}/edit`)} color="primary">
            <EditIcon />
          </IconButton>
        </Stack>

        {/* Metadata */}
        <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
          {meeting.clients && (
            <Chip label={`לקוח: ${meeting.clients.name}`} color="primary" variant="outlined" />
          )}
          {meeting.projects && (
            <Chip label={`פרויקט: ${meeting.projects.name}`} color="secondary" variant="outlined" />
          )}
          <Chip label={formatDate(meeting.meeting_date)} />
          <Chip 
            label={meeting.status === 'processed' ? 'מעובד' : meeting.status === 'draft' ? 'טיוטה' : 'ארכיון'} 
            color={meeting.status === 'processed' ? 'success' : 'default'} 
          />
        </Stack>

        {/* Participants */}
        {meeting.participants && meeting.participants.length > 0 && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              משתתפים: {meeting.participants.join(', ')}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* View Mode Toggle */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                console.log('🔄 Switching view mode to:', newMode);
                setViewMode(newMode);
              }
            }}
            size="small"
          >
            <ToggleButton value="raw">גרסה מקורית</ToggleButton>
            <ToggleButton value="processed" disabled={!meeting.processed_content}>
              גרסה מעובדת
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={processing ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
              onClick={handleProcess}
              disabled={processing}
            >
              {processing ? 'מעבד...' : 'עיבוד AI'}
            </Button>

            <Button
              variant="outlined"
              startIcon={translating ? <CircularProgress size={20} /> : <TranslateIcon />}
              onClick={handleTranslate}
              disabled={translating || !meeting.processed_content}
            >
              {translating ? 'מתרגם...' : 'תרגום'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
            >
              העתק עם עיצוב מלא
            </Button>
          </Stack>
        </Stack>

        {/* Content */}
        {content ? (
          <Box
            sx={{
              mt: 3,
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              minHeight: '300px',
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <Box
            sx={{
              mt: 3,
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography color="text.secondary">
              אין תוכן להצגה
            </Typography>
          </Box>
        )}

        {/* Footer Metadata */}
        <Box mt={4}>
          <Typography variant="caption" color="text.secondary">
            נוצר: {formatDateTime(meeting.created_at)}
          </Typography>
          {meeting.updated_at && meeting.updated_at !== meeting.created_at && (
            <>
              {' • '}
              <Typography variant="caption" color="text.secondary">
                עודכן: {formatDateTime(meeting.updated_at)}
              </Typography>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default MeetingView;
