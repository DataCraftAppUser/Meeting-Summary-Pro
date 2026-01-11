import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';
import { verifyHubAccess } from '../middleware/hubAccess';
import { processMeetingSummary, translateMeeting } from '../services/gemini';

const router = Router();

// ✅ פונקציה שבונה HTML מעוצב RTL
const buildFullRawContent = (data: {
  title: string;
  meeting_date: string;
  meeting_time?: string;
  workspace_name?: string;
  topic_name?: string;
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

// ✅ GET /api/items - קבלת רשימת פריטים (requires hub_id in query)
router.get('/', verifyHubAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = (req as any).hubId || req.query.hub_id;
    const { workspace_id, topic_id, status, content_type, search, page = 1, limit = 10 } = req.query;

    if (!hubId) {
      throw new AppError('hub_id is required', 400);
    }

    let query = supabase
      .from('items')
      .select(`
        *,
        workspaces:workspace_id (id, name),
        topics:topic_id (id, name)
      `, { count: 'exact' })
      .eq('hub_id', hubId);

    if (workspace_id) query = query.eq('workspace_id', workspace_id);
    if (topic_id) query = query.eq('topic_id', topic_id);
    if (status) query = query.eq('status', status);
    if (content_type) query = query.eq('content_type', content_type);
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const offset = (Number(page) - 1) * Number(limit);
    query = query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    // Enrich items with creator information from user_profiles
    if (data && data.length > 0) {
      const creatorIds = [...new Set(data.map((item: any) => item.created_by).filter(Boolean))];
      
      if (creatorIds.length > 0) {
        const { data: creators } = await supabase
          .from('user_profiles')
          .select('id, email, full_name, avatar_url')
          .in('id', creatorIds);

        // Create a map of creator info
        const creatorMap = new Map(
          (creators || []).map((c: any) => [c.id, c])
        );

        // Add creator info to each item
        data.forEach((item: any) => {
          if (item.created_by && creatorMap.has(item.created_by)) {
            item.creator = creatorMap.get(item.created_by);
          }
        });
      }
    }

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

// ✅ GET /api/items/:id - קבלת פריט בודד (requires hub_id in query)
router.get('/:id', verifyHubAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hubId = (req as any).hubId || req.query.hub_id;

    if (!hubId) {
      throw new AppError('hub_id is required', 400);
    }

    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        workspaces:workspace_id (id, name),
        topics:topic_id (id, name)
      `)
      .eq('id', id)
      .eq('hub_id', hubId)
      .single();

    if (error) throw new AppError(error.message, 500);
    if (!data) throw new AppError('פריט לא נמצא', 404);

    // Enrich item with creator information
    if (data.created_by) {
      const { data: creator } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', data.created_by)
        .single();

      if (creator) {
        data.creator = creator;
      }
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ✅ POST /api/items - יצירת פריט חדש (requires hub_id)
router.post('/', verifyHubAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hubId = (req as any).hubId || req.body.hub_id;
    const userId = (req as any).user?.id;
    
    if (!hubId) {
      throw new AppError('hub_id is required', 400);
    }

    const {
      workspace_id,
      topic_id,
      title,
      meeting_date,
      meeting_time,
      participants,
      content,
      content_type = 'meeting',
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
    const cleanWorkspaceId = workspace_id === 'undefined' || workspace_id === undefined ? null : workspace_id;
    const cleanTopicId = topic_id === 'undefined' || topic_id === undefined ? null : topic_id;

    // ✅ תיקון חדש: שלוף את שם הנושא מה-DB
    let topic_name = null;
    if (cleanTopicId) {
      const { data: topicData } = await supabase
        .from('topics')
        .select('name')
        .eq('id', cleanTopicId)
        .single();
      topic_name = topicData?.name;
    }

    // בניית full_raw_content
    const full_raw_content = buildFullRawContent({
      title,
      meeting_date,
      meeting_time,
      topic_name, // ← עכשיו זה מגיע מה-DB!
      participants,
      content,
      action_items,
      follow_up_required,
      follow_up_date,
      follow_up_time,
      follow_up_tbd,
    });

    const { data, error } = await supabase
      .from('items')
      .insert({
        hub_id: hubId,
        workspace_id: cleanWorkspaceId,
        topic_id: cleanTopicId,
        title,
        meeting_date,
        meeting_time,
        participants,
        content,
        content_type,
        full_raw_content,
        action_items: action_items || [],
        follow_up_required: follow_up_required || false,
        follow_up_date,
        follow_up_time,
        follow_up_tbd: follow_up_tbd || false,
        status,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw new AppError(error.message, 500);
    }

    console.log('✅ Item created successfully:', data);
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('❌ Error in POST /api/items:', error);
    next(error);
  }
});

// ✅ PUT /api/items/:id - עדכון פריט (requires hub_id)
router.put('/:id', verifyHubAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hubId = (req as any).hubId || req.body.hub_id;
    const updateData = { ...req.body };

    if (!hubId) {
      throw new AppError('hub_id is required', 400);
    }

    // ✅ תיקון: המרת undefined ל-null
    if (updateData.workspace_id === 'undefined' || updateData.workspace_id === undefined) {
      updateData.workspace_id = null;
    }
    if (updateData.topic_id === 'undefined' || updateData.topic_id === undefined) {
      updateData.topic_id = null;
    }

    // ✅ תיקון חדש: שלוף את המידע הקיים כדי להשלים שדות חסרים ב-buildFullRawContent
    const { data: item } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('hub_id', hubId)
      .single();

    if (!item) throw new AppError('פריט לא נמצא', 404);

    let topic_name = null;
    const topic_id = updateData.topic_id || item.topic_id;
    if (topic_id) {
      const { data: topicData } = await supabase
        .from('topics')
        .select('name')
        .eq('id', topic_id)
        .single();
      topic_name = topicData?.name;
    }

    // בניית full_raw_content מחדש
    if (updateData.title || updateData.content || updateData.topic_id) {
      updateData.full_raw_content = buildFullRawContent({
        title: updateData.title || item.title,
        meeting_date: updateData.meeting_date || item.meeting_date,
        meeting_time: updateData.meeting_time || item.meeting_time,
        topic_name,
        participants: updateData.participants || item.participants,
        content: updateData.content || item.content,
        action_items: updateData.action_items || item.action_items,
        follow_up_required: updateData.follow_up_required !== undefined ? updateData.follow_up_required : item.follow_up_required,
        follow_up_date: updateData.follow_up_date !== undefined ? updateData.follow_up_date : item.follow_up_date,
        follow_up_time: updateData.follow_up_time !== undefined ? updateData.follow_up_time : item.follow_up_time,
        follow_up_tbd: updateData.follow_up_tbd !== undefined ? updateData.follow_up_tbd : item.follow_up_tbd,
      });
    }

    updateData.updated_at = new Date().toISOString();

    console.log('📝 Updating item:', id, 'with data fields:', Object.keys(updateData));

    const { data, error } = await supabase
      .from('items')
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
          .from('items')
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

// ✅ DELETE /api/items/:id - מחיקת פריט (requires hub_id)
router.delete('/:id', verifyHubAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hubId = (req as any).hubId || req.query.hub_id;

    if (!hubId) {
      throw new AppError('hub_id is required', 400);
    }

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .eq('hub_id', hubId);

    if (error) throw new AppError(error.message, 500);

    res.json({ success: true, message: 'הפריט נמחק בהצלחה' });
  } catch (error) {
    next(error);
  }
});

// ✅ POST /api/items/:id/process - עיבוד AI
router.post('/:id/process', verifyHubAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hubId = (req as any).hubId || req.body.hub_id || req.query.hub_id;

    if (!hubId) {
      throw new AppError('hub_id is required', 400);
    }

    console.log('🤖 Processing item:', id, 'in hub:', hubId);

    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('hub_id', hubId)
      .single();

    if (fetchError) throw new AppError(fetchError.message, 500);
    if (!item) throw new AppError('פריט לא נמצא', 404);

    await supabase
      .from('items')
      .update({ status: 'processing' })
      .eq('id', id)
      .eq('hub_id', hubId);

    const result = await processMeetingSummary(
      item.full_raw_content || item.content,
      item.content_type || 'meeting'
    );

    const { data, error } = await supabase
      .from('items')
      .update({
        processed_content: result.content,
        processed_by: result.model,
        status: 'processed',
        is_processed_manually_updated: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('hub_id', hubId)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error in process route:', error);
      console.dir(error); // Full error details
      
      // ✅ ניסיון נוסף ללא השדה החדש אם הוא לא קיים ב-DB
      if (error.message.includes('processed_by') || error.message.includes('column') || error.code === '42703') {
        const { data: retryData, error: retryError } = await supabase
          .from('items')
          .update({
            processed_content: result.content,
            status: 'processed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('hub_id', hubId)
          .select()
          .single();
          
        if (!retryError) return res.json({ success: true, data: retryData });
      }
      throw new AppError(error.message, 500);
    }

    console.log('✅ Item processed successfully');
    res.json({ success: true, data });
  } catch (error) {
    console.error('❌ Error processing item:', error);
    next(error);
  }
});

// ✅ POST /api/items/:id/translate - תרגום
router.post('/:id/translate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.body;

    const { data: item, error: fetchError } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw new AppError(fetchError.message, 500);
    if (!item) throw new AppError('פריט לא נמצא', 404);

    const result = await translateMeeting(item.processed_content || item.content, language);

    const { error: saveError } = await supabase.from('item_translations').insert({
      item_id: id,
      language,
      translated_content: result.content,
      processed_by: result.model
    });

    if (saveError) {
      console.warn('Could not save translation:', saveError.message);
      // Retry without processed_by if it failed
      if (saveError.message.includes('processed_by')) {
        await supabase.from('item_translations').insert({
          item_id: id,
          language,
          translated_content: result.content,
        });
      }
    }

    res.json({ success: true, data: { language, content: result.content, model: result.model } });
  } catch (error) {
    next(error);
  }
});

// ✅ GET /api/items/:id/versions - גרסאות (requires hub_id)
router.get('/:id/versions', verifyHubAccess, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hubId = (req as any).hubId || req.query.hub_id;

    if (!hubId) {
      throw new AppError('hub_id is required', 400);
    }

    // Verify item belongs to hub
    const { data: item } = await supabase
      .from('items')
      .select('id')
      .eq('id', id)
      .eq('hub_id', hubId)
      .single();

    if (!item) {
      throw new AppError('Item not found in this hub', 404);
    }

    const { data, error } = await supabase
      .from('item_versions')
      .select('*')
      .eq('item_id', id)
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
