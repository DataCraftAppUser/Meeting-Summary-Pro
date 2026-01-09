# ⏱️ Time Tracking Expansion Guide

מדריך מלא להרחבת המערכת ל-Time Tracking

---

## 🎯 למה Time Tracking?

המבנה כבר מוכן! צריך רק להוסיף UI ופונקציונאליות.

**יתרונות:**
- מעקב אחר שעות עבודה לפי פרויקט
- חיוב מדויק ללקוחות
- ניתוח תקציבים vs שעות בפועל
- אינטגרציה עם סיכומי פגישות
- דוחות מפורטים ב-Power BI

---

## ✅ מה כבר קיים (מוכן לשימוש!)

### 1. Database Schema:

**טבלה `time_entries`:**
```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id),
  meeting_id UUID REFERENCES meetings(id),  -- קישור לסיכום!
  
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,  -- מחושב אוטומטית
  
  description TEXT,
  is_billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Triggers:**
- `calculate_duration()` - חישוב אוטומטי של duration
- `update_updated_at_column()` - עדכון updated_at

**Indexes:**
- על user_id, project_id, start_time (ביצועים!)

### 2. Database Views:

**`vw_time_tracking_report`** - מוכן ל-Power BI!

```sql
SELECT 
  work_date,
  hours,
  amount,  -- hours * hourly_rate
  client_name,
  project_name,
  meeting_title,
  is_billable
FROM vw_time_tracking_report;
```

### 3. Backend Routes (מוערים):

ב-`backend/src/routes/` - צריך רק לממש!

---

## 🛠️ מה צריך להוסיף

---

## שלב 1: Backend API Routes

### קובץ חדש: `backend/src/routes/time-entries.ts`

```typescript
import { Router } from 'express';
import { supabase } from '../services/supabase';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/time-entries - כל הרישומים
router.get('/', asyncHandler(async (req, res) => {
  const { user_id, project_id, start_date, end_date } = req.query;

  let query = supabase
    .from('time_entries')
    .select(`
      *,
      projects:project_id (id, name, client_id, clients(name))
    `);

  if (user_id) query = query.eq('user_id', user_id);
  if (project_id) query = query.eq('project_id', project_id);
  if (start_date) query = query.gte('start_time', start_date);
  if (end_date) query = query.lte('start_time', end_date);

  query = query.order('start_time', { ascending: false });

  const { data, error } = await query;

  if (error) throw new AppError('Failed to fetch time entries', 500);

  res.json({ success: true, data });
}));

// POST /api/time-entries - יצירת רישום חדש
router.post('/', asyncHandler(async (req, res) => {
  const {
    user_id,
    project_id,
    meeting_id,
    start_time,
    end_time,
    description,
    is_billable,
    hourly_rate,
  } = req.body;

  if (!user_id || !project_id || !start_time) {
    throw new AppError('Missing required fields', 400);
  }

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id,
      project_id,
      meeting_id: meeting_id || null,
      start_time,
      end_time: end_time || null,
      description,
      is_billable: is_billable !== undefined ? is_billable : true,
      hourly_rate,
    })
    .select()
    .single();

  if (error) throw new AppError('Failed to create time entry', 500);

  res.status(201).json({ success: true, data });
}));

// PUT /api/time-entries/:id - עדכון
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from('time_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new AppError('Failed to update time entry', 500);

  res.json({ success: true, data });
}));

// DELETE /api/time-entries/:id - מחיקה
router.delete('/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', req.params.id);

  if (error) throw new AppError('Failed to delete time entry', 500);

  res.json({ success: true });
}));

// GET /api/time-entries/summary - סיכום לפי פרויקט
router.get('/summary', asyncHandler(async (req, res) => {
  const { project_id, start_date, end_date } = req.query;

  let query = supabase
    .from('vw_time_tracking_report')
    .select('*');

  if (project_id) query = query.eq('project_id', project_id);
  if (start_date) query = query.gte('work_date', start_date);
  if (end_date) query = query.lte('work_date', end_date);

  const { data, error } = await query;

  if (error) throw new AppError('Failed to fetch summary', 500);

  // Calculate totals
  const totals = {
    total_hours: data.reduce((sum, entry) => sum + (entry.hours || 0), 0),
    billable_hours: data.reduce((sum, entry) => 
      sum + (entry.is_billable ? entry.hours || 0 : 0), 0),
    total_amount: data.reduce((sum, entry) => sum + (entry.amount || 0), 0),
  };

  res.json({ success: true, data, totals });
}));

export default router;
```

### עדכן `backend/src/server.ts`:

```typescript
import timeEntriesRouter from './routes/time-entries';

// ...

app.use('/api/time-entries', timeEntriesRouter);
```

---

## שלב 2: Frontend Components

### 2.1 Types - `frontend/src/types/TimeEntry.ts`

```typescript
export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  meeting_id?: string | null;
  start_time: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  description?: string;
  is_billable: boolean;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface TimeEntrySummary {
  total_hours: number;
  billable_hours: number;
  total_amount: number;
}
```

### 2.2 API Service - `frontend/src/services/timeEntriesApi.ts`

```typescript
import api from './api';
import { TimeEntry } from '../types/TimeEntry';

export const timeEntriesApi = {
  getAll: (params?: {
    user_id?: string;
    project_id?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get<{ data: TimeEntry[] }>('/time-entries', { params }),

  create: (entry: Partial<TimeEntry>) => 
    api.post<{ data: TimeEntry }>('/time-entries', entry),

  update: (id: string, updates: Partial<TimeEntry>) => 
    api.put<{ data: TimeEntry }>(`/time-entries/${id}`, updates),

  delete: (id: string) => 
    api.delete(`/time-entries/${id}`),

  getSummary: (params?: {
    project_id?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get<{ data: TimeEntry[]; totals: TimeEntrySummary }>(
    '/time-entries/summary', 
    { params }
  ),
};
```

### 2.3 Component - `frontend/src/components/time/TimeEntryForm.tsx`

```tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
} from '@mui/material';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ProjectSelect from '../projects/ProjectSelect';

interface TimeEntryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (entry: any) => void;
  initialData?: any;
}

export const TimeEntryForm: React.FC<TimeEntryFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    project_id: initialData?.project_id || '',
    start_time: initialData?.start_time || new Date(),
    end_time: initialData?.end_time || null,
    description: initialData?.description || '',
    is_billable: initialData?.is_billable !== false,
    hourly_rate: initialData?.hourly_rate || '',
  });

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'ערוך רישום שעות' : 'רישום שעות חדש'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <ProjectSelect
            value={formData.project_id}
            onChange={(project_id) => setFormData({ ...formData, project_id })}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="התחלה"
              value={formData.start_time}
              onChange={(date) => setFormData({ ...formData, start_time: date })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />

            <DateTimePicker
              label="סיום (אופציונלי)"
              value={formData.end_time}
              onChange={(date) => setFormData({ ...formData, end_time: date })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </LocalizationProvider>

          <TextField
            label="תיאור"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <TextField
            label="תעריף לשעה (₪)"
            type="number"
            value={formData.hourly_rate}
            onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_billable}
                onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
              />
            }
            label="חייב לקוח"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>ביטול</Button>
        <Button onClick={handleSubmit} variant="contained">
          {initialData ? 'עדכן' : 'שמור'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

### 2.4 Page - `frontend/src/pages/TimeTrackingPage.tsx`

```tsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { timeEntriesApi } from '../services/timeEntriesApi';
import { TimeEntryForm } from '../components/time/TimeEntryForm';
import { AccessTime, AttachMoney, Timer } from '@mui/icons-material';

export const TimeTrackingPage: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);

  // Fetch time entries
  const { data: entriesData } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => timeEntriesApi.getAll(),
  });

  // Fetch summary
  const { data: summaryData } = useQuery({
    queryKey: ['time-summary'],
    queryFn: () => timeEntriesApi.getSummary(),
  });

  const handleSubmit = async (entry: any) => {
    await timeEntriesApi.create(entry);
    // Refresh data...
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">מעקב שעות עבודה</Typography>
        <Button
          variant="contained"
          startIcon={<AccessTime />}
          onClick={() => setFormOpen(true)}
        >
          רישום שעות
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timer color="primary" />
                <Typography variant="h6">
                  {summaryData?.data.totals.total_hours.toFixed(1)} שעות
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                סה"כ החודש
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="success" />
                <Typography variant="h6">
                  {summaryData?.data.totals.billable_hours.toFixed(1)} שעות
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                שעות חייבות
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="warning" />
                <Typography variant="h6">
                  ₪{summaryData?.data.totals.total_amount.toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                הכנסות
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Time Entries Table/List */}
      {/* ... */}

      <TimeEntryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </Container>
  );
};
```

---

## שלב 3: אינטגרציה עם Meetings

### עדכן `MeetingEditorPage.tsx`:

```tsx
// לאחר שמירת סיכום, שאל:
const handleSave = async () => {
  await saveMeeting();

  // Show dialog
  const trackTime = window.confirm(
    'האם לרשום את זמן הפגישה למעקב שעות?'
  );

  if (trackTime && meeting.duration_minutes) {
    await timeEntriesApi.create({
      project_id: meeting.project_id,
      meeting_id: meeting.id,
      start_time: meeting.meeting_date,
      duration_minutes: meeting.duration_minutes,
      is_billable: true,
      description: `פגישה: ${meeting.title}`,
    });
  }
};
```

---

## 📊 שלב 4: Power BI Integration

**Already ready!** השתמש ב-`vw_time_tracking_report`

דוגמת דוח:
```
Client | Project | Hours | Amount | Billable %
-----------------------------------------------
ABC    | Website | 45.5  | ₪22,750| 100%
XYZ    | App     | 23.0  | ₪11,500| 87%
```

---

## ✅ Checklist להטמעה

- [ ] Backend: יצירת `routes/time-entries.ts`
- [ ] Backend: עדכון `server.ts` עם route
- [ ] Frontend: יצירת Types
- [ ] Frontend: יצירת API service
- [ ] Frontend: Component - TimeEntryForm
- [ ] Frontend: Page - TimeTrackingPage
- [ ] Frontend: אינטגרציה ב-MeetingEditor
- [ ] Frontend: הוספת route: `/time-tracking`
- [ ] Testing: CRUD operations
- [ ] Testing: אינטגרציה עם meetings
- [ ] Power BI: דוחות זמן

---

## 🎉 סיכום

**הכל מוכן להרחבה!**

- ✅ Database Schema קיים
- ✅ Views ל-Power BI מוכנים
- ✅ Triggers אוטומטיים פועלים
- ⏳ צריך רק UI + Routes

**זמן הטמעה משוער:** 2-3 ימי עבודה

**המערכת תהיה מלאה: Meetings + Time Tracking!** ⏱️🎊

---

**Built with ❤️ | Tracked with ⏱️**
