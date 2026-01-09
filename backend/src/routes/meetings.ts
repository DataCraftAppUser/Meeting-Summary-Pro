import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { processMeetingSummary, translateMeeting, enrichMeetingContent } from '../services/gemini';

const router = Router();

// ✅ פונקציה שבונה HTML מעוצב RTL
const buildFullRawContent = (data: {
  title: string;
  meeting_date: string;
  meeting_time?: string;
  client_name?: string;
  project_name?: string;
  participants?: string[];
  content: string;
  action_items?: Array<{ task: string; assignee: string; due_date?: string }>;
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_time?: string;
  follow_up_tbd?: boolean;
}): string => {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  let html = `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; direction: rtl; text-align: right;">`;
  
  // כותרת
  html += `<h2 style="text-align: right; direction: rtl; margin-bottom: 20px;">${data.title}</h2>`;
  
  // פרויקט (אם קיים)
  if (data.project_name) {
    html += `<p style="text-align: right; direction: rtl; margin: 10px 0;"><strong>פרויקט:</strong> ${data.project_name}</p>`;
  }
  
  // תאריך + שעה
  const dateText = formatDate(data.meeting_date);
  const timeText = data.meeting_time ? ` | ${data.meeting_time}` : '';
  html += `<p style="text-align: right; direction: rtl; margin: 10px 0;"><strong>תאריך:</strong> ${dateText}${timeText}</p>`;
  
  // משתתפים
  if (data.participants && data.participants.length > 0) {
    html += `<p style="text-align: right; direction: rtl; margin: 10px 0;"><strong>משתתפים:</strong> ${data.participants.join(', ')}</p>`;
  }
  
  // קו מפריד
  html += `<hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">`;
  
  // תוכן הפגישה
  html += `<div style="text-align: right; direction: rtl; white-space: pre-wrap;">${data.content}</div>`;
  
  // משימות להמשך
  if (data.action_items && data.action_items.length > 0) {
    html += `<hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">`;
    html += `<h3 style="text-align: right; direction: rtl; margin-top: 20px;">משימות להמשך:</h3>`;
    html += `<table style="width: 100%; border-collapse: collapse; direction: rtl; text-align: right;">`;
    html += `<thead><tr style="background-color: #f0f0f0;">`;
    html += `<th style="padding: 8px; border: 1px solid #ddd; text-align: right;">משימה</th>`;
    html += `<th style="padding: 8px; border: 1px solid #ddd; text-align: right;">מבצע</th>`;
    html += `<th style="padding: 8px; border: 1px solid #ddd; text-align: right;">תאריך יעד</th>`;
    html += `</tr></thead><tbody>`;
    
    data.action_items.forEach(item => {
      const dueDate = item.due_date ? formatDate(item.due_date) : '-';
      html += `<tr>`;
      html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.task}</td>`;
      html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.assignee}</td>`;
      html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${dueDate}</td>`;
      html += `</tr>`;
    });
    
    html += `</tbody></table>`;
  }
  
  // פגישת Follow Up
  if (data.follow_up_required) {
    html += `<hr style="margin: 20px 0; border: none; border-top: 1px solid #ccc;">`;
    html += `<h3 style="text-align: right; direction: rtl; margin-top: 20px;">פגישת המשך:</h3>`;
    
    if (data.follow_up_tbd) {
      html += `<p style="text-align: right; direction: rtl;">יקבע בהמשך</p>`;
    } else {
      const followUpDate = data.follow_up_date ? formatDate(data.follow_up_date) : '';
      const followUpTime = data.follow_up_time ? ` | ${data.follow_up_time}` : '';
      html += `<p style="text-align: right; direction: rtl;"><strong>תאריך:</strong> ${followUpDate}${followUpTime}</p>`;
    }
  }
  
  html += `</div>`;
  return html;
};

// ✅ GET /api/meetings - קבלת רשימת סיכומים
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { client_id, project_id, status, search, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('meetings')
      .select(`
        *,
        clients:client_id (id, name),
        projects:project_id (id, name)
      `, { count: 'exact' });

    if (client_id) query = query.eq('client_id', client_id);
    if (project_id) query = query.eq('project_id', project_id);
    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const offset = (Number(page) - 1) * Number(limit);
    query = query.order('meeting_date', { ascending: false }).range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ✅ GET /api/meetings/:id - קבלת סיכום בודד
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        clients:client_id (id, name),
        projects:project_id (id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw new AppError(error.message, 500);
    if (!data) throw new AppError('סיכום לא נמצא', 404);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ✅ POST /api/meetings - יצירת סיכום חדש
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      client_id,
      project_id,
      title,
      meeting_date,
      meeting_time,
      participants,
      content,
      action_items,
      follow_up_required,
      follow_up_date,
      follow_up_time,
      follow_up_tbd,
      status = 'draft',
    } = req.body;

    if (!title || !meeting_date || !content) {
      throw new AppError('חסרים שדות חובה', 400);
    }

    // ✅ תיקון: המרת undefined ל-null
    const cleanClientId = client_id === 'undefined' || client_id === undefined ? null : client_id;
    const cleanProjectId = project_id === 'undefined' || project_id === undefined ? null : project_id;

    // ✅ תיקון חדש: שלוף את שם הפרויקט מה-DB
    let project_name = null;
    if (cleanProjectId) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', cleanProjectId)
        .single();
      project_name = projectData?.name;
    }

    // בניית full_raw_content
    const full_raw_content = buildFullRawContent({
      title,
      meeting_date,
      meeting_time,
      project_name, // ← עכשיו זה מגיע מה-DB!
      participants,
      content,
      action_items,
      follow_up_required,
      follow_up_date,
      follow_up_time,
      follow_up_tbd,
    });

    const { data, error } = await supabase
      .from('meetings')
      .insert({
        client_id: cleanClientId,
        project_id: cleanProjectId,
        title,
        meeting_date,
        meeting_time,
        participants,
        content,
        full_raw_content,
        action_items: action_items || [],
        follow_up_required: follow_up_required || false,
        follow_up_date,
        follow_up_time,
        follow_up_tbd: follow_up_tbd || false,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw new AppError(error.message, 500);
    }

    console.log('✅ Meeting created successfully:', data);
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('❌ Error in POST /api/meetings:', error);
    next(error);
  }
});

// ✅ PUT /api/meetings/:id - עדכון סיכום
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // ✅ תיקון: המרת undefined ל-null
    if (updateData.client_id === 'undefined' || updateData.client_id === undefined) {
      updateData.client_id = null;
    }
    if (updateData.project_id === 'undefined' || updateData.project_id === undefined) {
      updateData.project_id = null;
    }

    // ✅ תיקון חדש: שלוף את שם הפרויקט מה-DB
    let project_name = null;
    if (updateData.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', updateData.project_id)
        .single();
      project_name = projectData?.name;
    }

    // בניית full_raw_content מחדש
    if (updateData.title || updateData.content) {
      updateData.full_raw_content = buildFullRawContent({
        title: updateData.title,
        meeting_date: updateData.meeting_date,
        meeting_time: updateData.meeting_time,
        project_name, // ← עכשיו זה מגיע מה-DB!
        participants: updateData.participants,
        content: updateData.content,
        action_items: updateData.action_items,
        follow_up_required: updateData.follow_up_required,
        follow_up_date: updateData.follow_up_date,
        follow_up_time: updateData.follow_up_time,
        follow_up_tbd: updateData.follow_up_tbd,
      });
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ✅ DELETE /api/meetings/:id - מחיקת סיכום
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('meetings').delete().eq('id', id);

    if (error) throw new AppError(error.message, 500);

    res.json({ success: true, message: 'הסיכום נמחק בהצלחה' });
  } catch (error) {
    next(error);
  }
});

// ✅ POST /api/meetings/:id/process - עיבוד AI
router.post('/:id/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    console.log('🤖 Processing meeting:', id);

    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw new AppError(fetchError.message, 500);
    if (!meeting) throw new AppError('סיכום לא נמצא', 404);

    await supabase.from('meetings').update({ status: 'processing' }).eq('id', id);

    const processedContent = await processMeetingSummary(meeting.full_raw_content || meeting.content);

    const { data, error } = await supabase
      .from('meetings')
      .update({
        processed_content: processedContent,
        status: 'processed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    console.log('✅ Meeting processed successfully');
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error processing meeting:', error);
    next(error);
  }
});

// ✅ POST /api/meetings/:id/translate - תרגום
router.post('/:id/translate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.body;

    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw new AppError(fetchError.message, 500);
    if (!meeting) throw new AppError('סיכום לא נמצא', 404);

    const translatedContent = await translateMeeting(meeting.processed_content || meeting.content, language);

    const { error: saveError } = await supabase.from('meeting_translations').insert({
      meeting_id: id,
      language,
      content: translatedContent,
    });

    if (saveError) {
      console.warn('Could not save translation:', saveError.message);
    }

    res.json({ success: true, data: { language, content: translatedContent } });
  } catch (error) {
    next(error);
  }
});

// ✅ POST /api/meetings/:id/enrich - העשרת תוכן
router.post('/:id/enrich', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw new AppError(fetchError.message, 500);
    if (!meeting) throw new AppError('סיכום לא נמצא', 404);

    const enrichedContent = await enrichMeetingContent(meeting.content);

    const { data, error } = await supabase
      .from('meetings')
      .update({
        content: enrichedContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ✅ GET /api/meetings/:id/versions - גרסאות
router.get('/:id/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('meeting_versions')
      .select('*')
      .eq('meeting_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message.includes('does not exist')) {
        return res.json({ success: true, data: [] });
      }
      throw new AppError(error.message, 500);
    }

    res.json({ success: true, data: data || [] });
  } catch (error) {
    next(error);
  }
});

export default router;
