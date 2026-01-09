/**
 * Projects Routes
 * ניהול פרויקטים - CRUD
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/projects
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { client_id, status, search } = req.query;

    let query = supabase.from('projects').select('*, clients(id, name)');

    if (client_id) {
      query = query.eq('client_id', client_id);
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
      throw new AppError(`Failed to fetch projects: ${error.message}`, 500);
    }

    res.json({ success: true, data });
  })
);

// GET /api/projects/:id
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(*), meetings(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      throw new AppError('Project not found', 404);
    }

    res.json({ success: true, data });
  })
);

// POST /api/projects
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      client_id,
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
      throw new AppError('Project name is required', 400);
    }

    if (!client_id) {
      throw new AppError('Client ID is required', 400);
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        client_id,
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
      throw new AppError(`Failed to create project: ${error.message}`, 500);
    }

    res.status(201).json({ success: true, data });
  })
);

// PUT /api/projects/:id
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const updates = req.body;

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update project: ${error.message}`, 500);
    }

    res.json({ success: true, data });
  })
);

// DELETE /api/projects/:id
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw new AppError(`Failed to delete project: ${error.message}`, 500);
    }

    res.json({ success: true, message: 'Project deleted' });
  })
);

export default router;
