/**
 * Workspaces Routes
 * ניהול Workspaces - CRUD פשוט
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/workspaces - כל ה-Workspaces
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { search, sort = 'name', order = 'asc' } = req.query;

    let query = supabase.from('workspaces').select('*');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.order(String(sort), { ascending: order === 'asc' });

    const { data, error } = await query;

    if (error) {
      throw new AppError(`Failed to fetch workspaces: ${error.message}`, 500);
    }

    res.json({ success: true, data });
  })
);

// GET /api/workspaces/:id - Workspace בודד
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*, topics(*), items(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      throw new AppError('Workspace not found', 404);
    }

    res.json({ success: true, data });
  })
);

// POST /api/workspaces - יצירת Workspace
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, company, notes } = req.body;

    if (!name) {
      throw new AppError('Workspace name is required', 400);
    }

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, email, phone, company, notes })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create workspace: ${error.message}`, 500);
    }

    res.status(201).json({ success: true, data });
  })
);

// PUT /api/workspaces/:id - עדכון Workspace
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, company, notes } = req.body;

    const { data, error } = await supabase
      .from('workspaces')
      .update({ name, email, phone, company, notes })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update workspace: ${error.message}`, 500);
    }

    res.json({ success: true, data });
  })
);

// DELETE /api/workspaces/:id - מחיקת Workspace
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw new AppError(`Failed to delete workspace: ${error.message}`, 500);
    }

    res.json({ success: true, message: 'Workspace deleted' });
  })
);

export default router;
