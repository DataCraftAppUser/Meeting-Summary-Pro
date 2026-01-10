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

  // ✅ רק התוכן המקורי - ללא מטא-דאטה (תאריך, משתתפים, פרויקט, action_items, follow_up)
  // תוכן הפגישה - שמור על HTML המקורי אם הוא קיים
  // אם התוכן כבר HTML (מכיל תגיות), עטוף אותו ב-div עם direction: rtl
  // אחרת, עטוף אותו ב-div עם white-space: pre-wrap
  if (data.content && data.content.trim().startsWith('<')) {
    // התוכן הוא HTML - עטוף אותו ב-div עם direction: rtl כדי לשמור על יישור ימין
    return `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; direction: rtl; text-align: right;"><div dir="rtl" style="text-align: right; direction: rtl;">${data.content}</div></div>`;
  } else {
    // התוכן הוא טקסט פשוט - עטוף אותו
    return `<div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; direction: rtl; text-align: right;"><div style="text-align: right; direction: rtl; white-space: pre-wrap;">${data.content}</div></div>`;
  }
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
    query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

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

    console.log('📝 Updating meeting:', id, 'with data fields:', Object.keys(updateData));

    const { data, error } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      
      // ✅ ניסיון נוסף ללא השדה החדש אם הוא לא קיים ב-DB
      if (error.message.includes('manually_updated') || error.message.includes('column') || error.code === '42703') {
        console.log('⚠️ is_processed_manually_updated column might be missing, retrying update without it...');
        const { is_processed_manually_updated, ...safeUpdateData } = updateData;
        const { data: retryData, error: retryError } = await supabase
          .from('meetings')
          .update(safeUpdateData)
          .eq('id', id)
          .select()
          .single();
          
        if (!retryError) {
          return res.json({ success: true, data: retryData });
        }
        console.error('❌ Retry also failed:', retryError);
      }
      
      throw new AppError(error.message, 500);
    }

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
        is_processed_manually_updated: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error in process route:', error);
      // ✅ ניסיון נוסף ללא השדה החדש אם הוא לא קיים ב-DB
      if (error.message.includes('manually_updated') || error.message.includes('column') || error.code === '42703') {
        const { data: retryData, error: retryError } = await supabase
          .from('meetings')
          .update({
            processed_content: processedContent,
            status: 'processed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();
          
        if (!retryError) return res.json({ success: true, data: retryData });
      }
      throw new AppError(error.message, 500);
    }

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
