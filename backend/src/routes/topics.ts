/**
 * Topics Routes
 * ניהול נושאים - CRUD
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/topics
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { workspace_id, status, search } = req.query;

    let query = supabase.from('topics').select('*, workspaces(id, name)');

    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new AppError(`Failed to fetch topics: ${error.message}`, 500);
    }

    res.json({ success: true, data });
  })
);

// GET /api/topics/:id
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
      .from('topics')
      .select('*, workspaces(*), items(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      throw new AppError('Topic not found', 404);
    }

    res.json({ success: true, data });
  })
);

// POST /api/topics
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      workspace_id,
      name,
      description,
      status,
      estimated_hours,
      budget_amount,
      hourly_rate,
      start_date,
      deadline,
    } = req.body;

    if (!name) {
      throw new AppError('Topic name is required', 400);
    }

    if (!workspace_id) {
      throw new AppError('Workspace ID is required', 400);
    }

    const { data, error } = await supabase
      .from('topics')
      .insert({
        workspace_id,
        name,
        description,
        status: status || 'active',
        estimated_hours,
        budget_amount,
        hourly_rate,
        start_date,
        deadline,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create topic: ${error.message}`, 500);
    }

    res.status(201).json({ success: true, data });
  })
);

// PUT /api/topics/:id
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const updates = req.body;

    const { data, error } = await supabase
      .from('topics')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update topic: ${error.message}`, 500);
    }

    res.json({ success: true, data });
  })
);

// DELETE /api/topics/:id
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw new AppError(`Failed to delete topic: ${error.message}`, 500);
    }

    res.json({ success: true, message: 'Topic deleted' });
  })
);

export default router;
