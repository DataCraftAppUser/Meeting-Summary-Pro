import RichTextEditor from '../Common/RichTextEditor';
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Autocomplete,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { he } from 'date-fns/locale';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { ItemFormData, Workspace, Topic, ActionItem } from '../../types';

// פונקציה פשוטה ליצירת ID זמני
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface ItemFormProps {
  formData: ItemFormData;
  onChange: (data: Partial<ItemFormData>) => void;
  workspaces: Workspace[];
  topics: Topic[];
  onCreateWorkspace: () => void;
  onCreateTopic: () => void;
  loading?: boolean;
}

// פונקציה לעיגול שעה ל-5 דקות כלפי מטה
const roundToFiveMinutes = (date: Date): Date => {
  const newDate = new Date(date);
  const minutes = newDate.getMinutes();
  const roundedMinutes = Math.floor(minutes / 5) * 5;
  newDate.setMinutes(roundedMinutes);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate;
};

export default function ItemForm({
  formData,
  onChange,
  workspaces,
  topics,
  onCreateWorkspace,
  onCreateTopic,
  loading = false,
}: ItemFormProps) {
  // State for Accordion expansion
  const [expandedSections, setExpandedSections] = useState<string[]>(['section1', 'section2']);

  // State for action items
  const [actionItems, setActionItems] = useState<ActionItem[]>(
    formData.action_items || []
  );

  // State for follow up
  const [followUpRequired, setFollowUpRequired] = useState(
    formData.follow_up_required || false
  );
  const [followUpTbd, setFollowUpTbd] = useState(
    formData.follow_up_tbd || false
  );

  // Initialize meeting time with current time rounded down
  useEffect(() => {
    if (!formData.meeting_time) {
      const now = new Date();
      const rounded = roundToFiveMinutes(now);
      const timeString = rounded.toTimeString().slice(0, 5); // HH:MM
      onChange({ meeting_time: timeString });
    }
  }, []);

  // Sync action items with formData
  useEffect(() => {
    onChange({ action_items: actionItems });
  }, [actionItems]);

  // Sync follow up with formData
  useEffect(() => {
    onChange({ 
      follow_up_required: followUpRequired,
      follow_up_tbd: followUpTbd 
    });
  }, [followUpRequired, followUpTbd]);

  const handleAccordionChange = (section: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSections(prev => {
      if (isExpanded) {
        if (section === 'section2') {
          // צמצם את פרטי הפריט כשפותחים את התוכן
          return [...prev.filter(s => s !== 'section1'), section];
        }
        return [...prev, section];
      } else {
        return prev.filter(s => s !== section);
      }
    });
  };

  const handleEditorFocus = () => {
    // צמצם את פרטי הפריט כשהעורך בפוקוס
    setExpandedSections(prev => prev.filter(s => s !== 'section1'));
  };

  // Action Items handlers
  const handleAddActionItem = () => {
    const newItem: ActionItem = {
      id: generateTempId(),
      task: '',
      assignee: '',
      due_date: undefined,
    };
    setActionItems([...actionItems, newItem]);
  };

  const handleUpdateActionItem = (id: string, field: keyof ActionItem, value: any) => {
    setActionItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleDeleteActionItem = (id: string) => {
    setActionItems(prev => prev.filter(item => item.id !== id));
  };

  // Parse time string to Date object for TimePicker
  const getTimeValue = (): Date | null => {
    if (!formData.meeting_time) return null;
    const [hours, minutes] = formData.meeting_time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Format Date to time string (HH:MM)
  const formatTimeString = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    return date.toTimeString().slice(0, 5);
  };

  // Filter topics by selected workspace
  const filteredTopics = formData.workspace_id
    ? topics.filter(t => t.workspace_id === formData.workspace_id)
    : topics;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Box>
        {/* ========================================
            Section 1: פרטי הפריט
        ======================================== */}
        <Accordion
          expanded={expandedSections.includes('section1')}
          onChange={handleAccordionChange('section1')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <DescriptionIcon color="primary" />
              <Typography variant="h6">פרטי הפריט</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* כותרת הפריט */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="כותרת הפריט"
                  value={formData.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  required
                  placeholder="לדוגמה: פגישת חקר מצב קיים"
                  InputProps={{
                    startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Grid>

              {/* סוג תוכן */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="סוג תוכן"
                  value={formData.content_type || 'meeting'}
                  onChange={(e) => onChange({ content_type: e.target.value as 'meeting' | 'work_log' | 'knowledge' })}
                >
                  <MenuItem value="meeting">פגישה</MenuItem>
                  <MenuItem value="work_log">יומן עבודה</MenuItem>
                  <MenuItem value="knowledge">ידע</MenuItem>
                </TextField>
              </Grid>

              {/* תאריך */}
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="תאריך"
                  value={formData.meeting_date ? new Date(formData.meeting_date) : null}
                  onChange={(date: Date | null) =>
                    onChange({ meeting_date: date ? date.toISOString().split('T')[0] : '' })
                  }
                  components={{
                    OpenPickerIcon: ArrowDropDownIcon
                  }}
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <EventIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  )}
                />
              </Grid>

              {/* שעה */}
              <Grid item xs={12} sm={6} md={3}>
                <TimePicker
                  label="שעה"
                  value={getTimeValue()}
                  onChange={(date: Date | null) => onChange({ meeting_time: formatTimeString(date) })}
                  minutesStep={5}
                  ampm={false}
                  components={{
                    OpenPickerIcon: ArrowDropDownIcon
                  }}
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Workspace */}
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  options={workspaces}
                  getOptionLabel={(option) => option.name}
                  value={workspaces.find((w) => w.id === formData.workspace_id) || null}
                  onChange={(_, value) => {
                    onChange({ 
                      workspace_id: value?.id,
                      topic_id: undefined
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Workspace"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={onCreateWorkspace}
                  sx={{ mt: 0.5 }}
                >
                  צור Workspace
                </Button>
              </Grid>

              {/* נושא */}
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  options={filteredTopics}
                  getOptionLabel={(option) => option.name}
                  value={filteredTopics.find((t) => t.id === formData.topic_id) || null}
                  onChange={(_, value) => onChange({ topic_id: value?.id })}
                  disabled={!formData.workspace_id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="נושא"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <FolderIcon sx={{ mr: 1, color: 'action.active' }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={onCreateTopic}
                  disabled={!formData.workspace_id}
                  sx={{ mt: 0.5 }}
                >
                  צור נושא
                </Button>
              </Grid>

              {/* משתתפים */}
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={formData.participants || []}
                  onChange={(_, value) => onChange({ participants: value as string[] })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} {...getTagProps({ index })} key={index} />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="משתתפים"
                      placeholder="הוסף משתתף..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <PeopleIcon sx={{ mr: 1, color: 'action.active' }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* ========================================
            Section 2: תוכן הפריט
        ======================================== */}
        <Accordion
          expanded={expandedSections.includes('section2')}
          onChange={handleAccordionChange('section2')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <EditIcon color="primary" />
              <Typography variant="h6">תוכן הפריט</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
			  <RichTextEditor
				value={formData.content || ''}
				onChange={(value) => onChange({ content: value })}
				onFocus={handleEditorFocus}
				placeholder="הזן את תוכן הפריט..."
			  />
			</Box>
          </AccordionDetails>
        </Accordion>

        {/* ========================================
            Section 3: מידע נוסף
        ======================================== */}
        <Accordion
          expanded={expandedSections.includes('section3')}
          onChange={handleAccordionChange('section3')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <SettingsIcon color="primary" />
              <Typography variant="h6">מידע נוסף</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {/* משימות להמשך */}
              <Box mb={4}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  📋 משימות להמשך
                </Typography>

                {actionItems.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width="40%">שם המשימה</TableCell>
                          <TableCell width="25%">מבצע</TableCell>
                          <TableCell width="25%">תאריך יעד</TableCell>
                          <TableCell width="10%" align="center">פעולות</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {actionItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                value={item.task}
                                onChange={(e) =>
                                  handleUpdateActionItem(item.id, 'task', e.target.value)
                                }
                                placeholder="שם המשימה"
                                required
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                value={item.assignee}
                                onChange={(e) =>
                                  handleUpdateActionItem(item.id, 'assignee', e.target.value)
                                }
                                placeholder="מבצע"
                              />
                            </TableCell>
                            <TableCell>
                              <DatePicker
                                value={item.due_date ? new Date(item.due_date) : null}
                                onChange={(date: Date | null) =>
                                  handleUpdateActionItem(
                                    item.id,
                                    'due_date',
                                    date ? date.toISOString().split('T')[0] : undefined
                                  )
                                }
                                components={{
                                  OpenPickerIcon: ArrowDropDownIcon
                                }}
                                renderInput={(params: any) => (
                                  <TextField {...params} fullWidth size="small" />
                                )}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteActionItem(item.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    אין משימות עדיין
                  </Typography>
                )}

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddActionItem}
                  size="small"
                >
                  הוסף משימה
                </Button>
              </Box>

              {/* פגישת Follow Up */}
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  🔁 פגישת Follow Up
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={followUpRequired}
                      onChange={(e) => setFollowUpRequired(e.target.checked)}
                    />
                  }
                  label="נדרשת פגישת המשך?"
                />

                {followUpRequired && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={4}>
                      <DatePicker
                        label="תאריך"
                        value={formData.follow_up_date ? new Date(formData.follow_up_date) : null}
                        onChange={(date: Date | null) =>
                          onChange({
                            follow_up_date: date ? date.toISOString().split('T')[0] : undefined,
                          })
                        }
                        disabled={followUpTbd}
                        components={{
                          OpenPickerIcon: ArrowDropDownIcon
                        }}
                        renderInput={(params: any) => (
                          <TextField {...params} fullWidth size="small" />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TimePicker
                        label="שעה"
                        value={
                          formData.follow_up_time
                            ? (() => {
                                const [hours, minutes] = formData.follow_up_time.split(':').map(Number);
                                const date = new Date();
                                date.setHours(hours, minutes, 0, 0);
                                return date;
                              })()
                            : null
                        }
                        onChange={(date: Date | null) =>
                          onChange({
                            follow_up_time: date ? date.toTimeString().slice(0, 5) : undefined,
                          })
                        }
                        minutesStep={5}
                        ampm={false}
                        disabled={followUpTbd}
                        components={{
                          OpenPickerIcon: ArrowDropDownIcon
                        }}
                        renderInput={(params: any) => (
                          <TextField {...params} fullWidth size="small" />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={followUpTbd}
                            onChange={(e) => setFollowUpTbd(e.target.checked)}
                          />
                        }
                        label="יקבע בהמשך"
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </LocalizationProvider>
  );
}
