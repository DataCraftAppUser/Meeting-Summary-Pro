import React, { useState, useEffect } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Button,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { usePrompts } from '../hooks/usePrompts';
import { useToast } from '../hooks/useToast';
import Loading from '../components/Common/Loading';

export default function PromptsManagement() {
  const { prompts, loading, fetchPrompts, updatePrompt } = usePrompts();
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editConfig, setEditConfig] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleStartEdit = (prompt: any) => {
    setEditingId(prompt.id);
    setEditContent(prompt.content || '');
    setEditConfig(prompt.configuration ? JSON.stringify(prompt.configuration, null, 2) : '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditConfig('');
  };

  const handleSaveEdit = async (prompt: any) => {
    try {
      setProcessing(true);
      setError(null);

      let configuration;
      if (editConfig.trim()) {
        try {
          configuration = JSON.parse(editConfig);
        } catch (e) {
          setError('Configuration אינו JSON תקין');
          return;
        }
      }

      const success = await updatePrompt(prompt.id, editContent, configuration);
      if (success) {
        setSuccess('פרומפט עודכן בהצלחה');
        setEditingId(null);
        setEditContent('');
        setEditConfig('');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('שגיאה בעדכון פרומפט');
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון פרומפט');
    } finally {
      setProcessing(false);
    }
  };

  if (loading && prompts.length === 0) {
    return <Loading />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          ניהול פרומפטים AI
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          ערוך את הפרומפטים המשמשים לעיבוד תוכן ב-AI
        </Typography>
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

      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            פרומפטים זמינים ({prompts.length})
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
              {loading ? (
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
                  <React.Fragment key={prompt.id}>
                    {editingId === prompt.id ? (
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
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
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
                              value={editConfig}
                              onChange={(e) => setEditConfig(e.target.value)}
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
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={handleCancelEdit}
                                disabled={processing}
                                startIcon={<CancelIcon />}
                              >
                                ביטול
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleSaveEdit(prompt)}
                                disabled={processing}
                                startIcon={<SaveIcon />}
                              >
                                {processing ? 'שומר...' : 'שמור שינויים'}
                              </Button>
                            </Stack>
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
                            onClick={() => handleStartEdit(prompt)}
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
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
