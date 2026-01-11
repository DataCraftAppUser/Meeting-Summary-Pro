import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  Translate as TranslateIcon,
  AutoAwesome as AutoAwesomeIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { useItems } from '../hooks/useItems';
import { useToast } from '../hooks/useToast';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import Loading from '../components/Common/Loading';
import RichTextEditor from '../components/Common/RichTextEditor';
import ConfirmDialog from '../components/Common/ConfirmDialog';

const ItemView = () => {
  const { id, hub_id } = useParams<{ id: string; hub_id: string }>();
  const navigate = useNavigate();
  const { getItem, processItem, translateItem, updateItem } = useItems();
  const { showToast } = useToast();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [viewMode, setViewMode] = useState<'raw' | 'processed'>('raw');
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedProcessedContent, setEditedProcessedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [processConfirmOpen, setProcessConfirmOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    if (!id || !hub_id) return;

    setLoading(true);
    try {
      console.log('📥 Loading item:', id);
      const data = await getItem(id, hub_id);
      console.log('✅ Item loaded:', data);
      
      if (data) {
        setItem(data);
        
        if (data.processed_content) {
          setViewMode('processed');
        }
      }
    } catch (error) {
      console.error('❌ Error loading item:', error);
      showToast('שגיאה בטעינת הפריט', 'error');
      navigate(hub_id ? `/hub/${hub_id}/items` : '/items');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!item) return;

    // ✅ בדיקה אם קיימים שינויים ידניים
    if (item.is_processed_manually_updated) {
      setProcessConfirmOpen(true);
      return;
    }

    startProcessing();
  };

  const startProcessing = async () => {
    setProcessing(true);
    try {
      console.log('🤖 Starting process for item:', item.id);
      
      if (!hub_id) {
        showToast('hub_id נדרש', 'error');
        return;
      }
      await processItem(item.id, hub_id);
      
      console.log('✅ Process completed, reloading item...');
      
      await loadItem();
      
      setViewMode('processed');
      
      showToast('הפריט עובד בהצלחה', 'success');
    } catch (error) {
      console.error('❌ Error in handleProcess:', error);
      showToast('שגיאה בעיבוד הפריט', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleTranslate = async () => {
    if (!item) return;

    setTranslating(true);
    try {
      const result = await translateItem(item.id, 'en');
      
      if (!result) {
        throw new Error('Translation failed');
      }
      
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html dir="ltr" lang="en">
          <head>
            <meta charset="UTF-8">
            <title>${item.title} - Translation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.8; padding: 20px; direction: ltr; text-align: left; }
            </style>
          </head>
          <body>
            ${result.translated_content || result.content || result}
          </body>
          </html>
        `);
        newWindow.document.close();
      }
      
      showToast('התרגום הושלם', 'success');
    } catch (error) {
      console.error('❌ Translation error:', error);
      showToast('שגיאה בתרגום הפריט', 'error');
    } finally {
      setTranslating(false);
    }
  };

  // ✅ חישוב התוכן ל-useMemo
  const content = item ? (viewMode === 'raw'
    ? (item as any).full_raw_content || item.content
    : item.processed_content || item.content) : null;

  // ✅ תיקון התוכן - החלף text-align: left ב-text-align: right ו-direction: ltr ב-rtl
  const fixedContent = useMemo(() => {
    if (!content) return null;
    
    let fixed = content;
    
    // תיקון inline styles - החלף text-align: left/center ב-text-align: right
    fixed = fixed.replace(/text-align:\s*(left|center)/gi, 'text-align: right');
    fixed = fixed.replace(/direction:\s*ltr/gi, 'direction: rtl');
    
    // תיקון align attributes - החלף align="left" או align="center" ב-align="right"
    fixed = fixed.replace(/align\s*=\s*["'](left|center)["']/gi, 'align="right"');
    
    // תיקון dir attributes - החלף dir="ltr" ב-dir="rtl"
    fixed = fixed.replace(/dir\s*=\s*["']ltr["']/gi, 'dir="rtl"');
    
    // הוסף dir="rtl" לכל div שאין לו
    fixed = fixed.replace(/<div([^>]*?)(?:\s+dir\s*=\s*["'][^"']*["'])?([^>]*)>/gi, (match: string) => {
      if (!match.includes('dir=')) {
        // הוסף dir="rtl" אם אין
        const styleMatch = match.match(/style\s*=\s*["']([^"']*)["']/);
        if (styleMatch) {
          // יש style - הוסף text-align: right; direction: rtl אם אין
          let styles = styleMatch[1];
          if (!styles.includes('text-align')) {
            styles += '; text-align: right';
          } else {
            styles = styles.replace(/text-align:\s*[^;]+/gi, 'text-align: right');
          }
          if (!styles.includes('direction')) {
            styles += '; direction: rtl';
          } else {
            styles = styles.replace(/direction:\s*[^;]+/gi, 'direction: rtl');
          }
          return match.replace(/style\s*=\s*["'][^"']*["']/, `style="${styles}"`).replace(/<div/, '<div dir="rtl"');
        } else {
          // אין style - הוסף dir="rtl" ו-style
          return match.replace(/<div/, '<div dir="rtl" style="text-align: right; direction: rtl;"');
        }
      }
      return match;
    });
    
    // הוסף dir="rtl" לכל p שאין לו
    fixed = fixed.replace(/<p([^>]*?)(?:\s+dir\s*=\s*["'][^"']*["'])?([^>]*)>/gi, (match: string) => {
      if (!match.includes('dir=')) {
        const styleMatch = match.match(/style\s*=\s*["']([^"']*)["']/);
        if (styleMatch) {
          let styles = styleMatch[1];
          if (!styles.includes('text-align')) {
            styles += '; text-align: right';
          } else {
            styles = styles.replace(/text-align:\s*[^;]+/gi, 'text-align: right');
          }
          if (!styles.includes('direction')) {
            styles += '; direction: rtl';
          } else {
            styles = styles.replace(/direction:\s*[^;]+/gi, 'direction: rtl');
          }
          return match.replace(/style\s*=\s*["'][^"']*["']/, `style="${styles}"`).replace(/<p/, '<p dir="rtl"');
        } else {
          return match.replace(/<p/, '<p dir="rtl" style="text-align: right; direction: rtl;"');
        }
      }
      return match;
    });
    
    return fixed;
  }, [content, viewMode]);

  // ✅ תיקון אוטומטי של התוכן אחרי שהוא נטען
  useEffect(() => {
    if (!fixedContent) return;
    
    // השתמש ב-setTimeout כדי לוודא שה-HTML כבר נטען ב-DOM
    const timer = setTimeout(() => {
      if (contentRef.current) {
        const contentElement = contentRef.current;
        // מצא את כל האלמנטים בתוכן ותקן אותם
        const allElements = contentElement.querySelectorAll('*');
        allElements.forEach((el: Element) => {
          const htmlEl = el as HTMLElement;
          // תקן direction
          htmlEl.style.setProperty('direction', 'rtl', 'important');
          htmlEl.style.setProperty('text-align', 'right', 'important');
          // תקן align attribute
          if (htmlEl.hasAttribute('align')) {
            htmlEl.setAttribute('align', 'right');
          }
          // תקן dir attribute
          htmlEl.setAttribute('dir', 'rtl');
        });
        
        // תקן את ה-container עצמו
        contentElement.style.setProperty('direction', 'rtl', 'important');
        contentElement.style.setProperty('text-align', 'right', 'important');
        contentElement.setAttribute('dir', 'rtl');
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fixedContent, viewMode]);

  const handleCopy = () => {
    if (!item) return;

    let content = viewMode === 'raw'
      ? (item as any).full_raw_content || item.content
      : item.processed_content || item.content;

    if (!content) {
      showToast('אין תוכן להעתקה', 'warning');
      return;
    }

    try {
      // 🎯 הסרת <div dir="rtl"> wrapper
      content = content.trim();
      content = content.replace(/^<div\s+dir\s*=\s*["']rtl["']\s*>\s*/i, '');
      content = content.replace(/\s*<\/div>\s*$/i, '');

      console.log('🧹 Removed wrapper');

      // 🎯 עטיפה מינימלית - רק CSS לביטול רקע, ללא שינוי פונט
      const wrappedContent = `
<html>
<head>
<style>
  * { 
    background: transparent !important; 
    background-color: transparent !important; 
  }
</style>
</head>
<body>
${content}
</body>
</html>`;

      console.log('🎨 Wrapped with transparent background CSS only (no font changes)');

      // העתקה
      const tempDiv = document.createElement('div');
      tempDiv.contentEditable = 'true';
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.opacity = '0';
      
      tempDiv.innerHTML = wrappedContent;
      document.body.appendChild(tempDiv);

      tempDiv.focus();
      const range = document.createRange();
      range.selectNodeContents(tempDiv);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      const success = document.execCommand('copy');

      if (selection) {
        selection.removeAllRanges();
      }
      document.body.removeChild(tempDiv);

      if (success) {
        showToast('הועתק ללוח!', 'success');
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      console.error('❌ Copy error:', err);
      showToast('שגיאה בהעתקה', 'error');
    }
  };

  // ✅ תפריט קונטקסט (לחצן ימני)
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : null,
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // ✅ הסרת עיבוד
  const handleRemoveProcessing = async () => {
    handleCloseContextMenu();
    if (!item || !id) return;

    if (window.confirm('האם אתה בטוח שברצונך להסיר את העיבוד לחלוטין?')) {
      setLoading(true);
      try {
        if (!hub_id) {
          showToast('hub_id נדרש', 'error');
          return;
        }
        const success = await updateItem(id, {
          hub_id,
          processed_content: '', // מחיקת התוכן
          status: 'draft',
          is_processed_manually_updated: false
        });
        
        if (success) {
          // טען מחדש
          await loadItem();
          setViewMode('raw');
          showToast('העיבוד הוסר בהצלחה', 'success');
        }
      } catch (error) {
        console.error('❌ Error in handleRemoveProcessing:', error);
        showToast('שגיאה בהסרת העיבוד', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // ✅ עריכת עיבוד
  const handleOpenEditDialog = () => {
    handleCloseContextMenu();
    setEditedProcessedContent(item?.processed_content || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveProcessedContent = async () => {
    if (!id) return;
    
    console.log('💾 Saving edited processed content, length:', editedProcessedContent.length);
    
    setIsSaving(true);
    try {
      if (!hub_id) {
        showToast('hub_id נדרש', 'error');
        return;
      }
      const success = await updateItem(id, { 
        hub_id,
        processed_content: editedProcessedContent,
        is_processed_manually_updated: true
      });
      
      if (success) {
        // עדכון מקומי מהיר לפני הטעינה מהשרת
        setItem((prev: any) => ({ ...prev, is_processed_manually_updated: true }));
        await loadItem();
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error('❌ Error saving processed content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <Loading message="טוען פריט..." />;
  }

  if (!item) {
    return (
      <Container>
        <Typography>הפריט לא נמצא</Typography>
      </Container>
    );
  }


  console.log('🎨 Rendering content:', {
    viewMode,
    hasContent: !!content,
    contentLength: content?.length,
    contentPreview: content?.substring(0, 100)
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            {item.title}
          </Typography>
          <IconButton onClick={() => navigate(hub_id ? `/hub/${hub_id}/items/${id}/edit` : `/items/${id}/edit`)} color="primary">
            <EditIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={3} mb={2} flexWrap="wrap" alignItems="center">
          {item.workspaces && (
            <Typography variant="body2" color="text.secondary">
              <Box component="span" sx={{ fontWeight: 'bold' }}>עולם תוכן/לקוח:</Box> {item.workspaces.name}
            </Typography>
          )}
          {item.topics && (
            <Typography variant="body2" color="text.secondary">
              <Box component="span" sx={{ fontWeight: 'bold' }}>נושא/פרויקט:</Box> {item.topics.name}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            📅 {formatDate(item.meeting_date)}
          </Typography>
        </Stack>

        <Divider sx={{ my: 3 }} />

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
            <ToggleButton value="raw">גרסת מקור</ToggleButton>
            <ToggleButton 
              value="processed" 
              disabled={!item.processed_content}
              onContextMenu={handleContextMenu}
              sx={{ position: 'relative' }}
            >
              גרסת AI
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Context Menu for Processed Toggle */}
          <Menu
            open={contextMenu !== null}
            onClose={handleCloseContextMenu}
            anchorReference="anchorPosition"
            anchorPosition={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
          >
            <MenuItem onClick={handleOpenEditDialog}>
              <EditIcon sx={{ ml: 1, fontSize: 18 }} />
              ערוך עיבוד
            </MenuItem>
            <MenuItem onClick={handleRemoveProcessing} sx={{ color: 'error.main' }}>
              <DeleteForeverIcon sx={{ ml: 1, fontSize: 18 }} />
              הסר עיבוד
            </MenuItem>
          </Menu>

          {/* Edit Processed Content Dialog */}
          <Dialog 
            open={isEditDialogOpen} 
            onClose={() => setIsEditDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>עריכת תוכן מעובד</DialogTitle>
            <DialogContent dividers>
              <RichTextEditor
                value={editedProcessedContent}
                onChange={(newContent) => {
                  console.log('✍️ Editor content changed, length:', newContent.length);
                  setEditedProcessedContent(newContent);
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsEditDialogOpen(false)}>ביטול</Button>
              <Button 
                onClick={handleSaveProcessedContent} 
                variant="contained" 
                disabled={isSaving}
              >
                {isSaving ? 'שומר...' : 'שמור שינויים'}
              </Button>
            </DialogActions>
          </Dialog>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={processing ? <CircularProgress size={20} sx={{ color: 'error.main' }} /> : <AutoAwesomeIcon />}
              onClick={handleProcess}
              disabled={processing}
              sx={{
                bgcolor: 'white',
                color: 'error.main',
                border: '1px solid',
                borderColor: 'error.main',
                '&:hover': {
                  bgcolor: 'rgba(229, 62, 62, 0.04)',
                  borderColor: 'error.dark',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                }
              }}
            >
              {processing ? 'מעבד...' : 'עיבוד AI'}
            </Button>

            <Button
              variant="outlined"
              startIcon={translating ? <CircularProgress size={20} /> : <TranslateIcon />}
              onClick={handleTranslate}
              disabled={translating || !item?.processed_content}
            >
              {translating ? 'מתרגם...' : 'תרגום'}
            </Button>

            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopy}
            >
              העתק
            </Button>
          </Stack>
        </Stack>

        {fixedContent ? (
          <Box
            ref={contentRef}
            sx={{
              mt: 3,
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              minHeight: '300px',
              direction: 'rtl !important',
              textAlign: 'right !important',
              '& > *': {
                direction: 'rtl !important',
                textAlign: 'right !important',
              },
              '& *': {
                direction: 'rtl !important',
                textAlign: 'right !important',
                '&[style*="text-align"]': {
                  textAlign: 'right !important',
                },
                '&[style*="direction"]': {
                  direction: 'rtl !important',
                },
                '&[align]': {
                  textAlign: 'right !important',
                },
              },
              '& ul, & ol': {
                paddingRight: '40px !important',
                paddingLeft: '0 !important',
                marginRight: '0 !important',
                marginLeft: '0 !important',
                textAlign: 'right !important',
                direction: 'rtl !important',
              },
              '& li': {
                textAlign: 'right !important',
                direction: 'rtl !important',
                marginRight: '0 !important',
                marginLeft: '0 !important',
              },
              '& p': {
                margin: '0 0 12px 0',
                textAlign: 'right !important',
                direction: 'rtl !important',
              },
              '& div': {
                textAlign: 'right !important',
                direction: 'rtl !important',
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                textAlign: 'right !important',
                direction: 'rtl !important',
              },
              '& div[style*="white-space: pre-wrap"]': {
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                textAlign: 'right !important',
                direction: 'rtl !important',
              },
            }}
            dangerouslySetInnerHTML={{ __html: fixedContent }}
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

        <Box mt={4}>
          <Typography variant="caption" color="text.secondary">
            נוצר: {formatDateTime(item.created_at)}
          </Typography>
          {item.updated_at && item.updated_at !== item.created_at && (
            <>
              {' • '}
              <Typography variant="caption" color="text.secondary">
                עודכן: {formatDateTime(item.updated_at)}
              </Typography>
            </>
          )}
          {item.is_processed_manually_updated && (
            <>
              {' • '}
              <Typography variant="caption" color="text.secondary">
                גרסת AI עודכנה ידנית
              </Typography>
            </>
          )}
          {viewMode === 'processed' && item.processed_by && (
            <>
              {' • '}
              <Typography variant="caption" color="text.secondary">
                עובד באמצעות DocCraftAI {item.processed_by} Processor
              </Typography>
            </>
          )}
        </Box>
      </Paper>

      {/* Modern Confirm Dialog for AI Processing */}
      <ConfirmDialog
        open={processConfirmOpen}
        title="עיבוד AI מחדש"
        message="שינויים ידניים זוהו: עיבוד מחדש יחליף את העריכה שלך בטקסט חדש. האם להמשיך?"
        onConfirm={() => {
          setProcessConfirmOpen(false);
          startProcessing();
        }}
        onCancel={() => setProcessConfirmOpen(false)}
        severity="warning"
      />
    </Container>
  );
};

export default ItemView;
