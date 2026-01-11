/**
 * Workspaces Routes
 * ניהול Workspaces - CRUD פשוט
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { verifyHubAccess } from '../middleware/hubAccess';

const router = Router();

// GET /api/workspaces - כל ה-Workspaces של Hub מסוים (requires hub_id in query)
router.get(
  '/',
  verifyHubAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const hubId = (req as any).hubId || req.query.hub_id;
    const { search, sort = 'name', order = 'asc' } = req.query;

    if (!hubId) {
      throw new AppError('hub_id is required', 400);
    }

    let query = supabase.from('workspaces').select('*').eq('hub_id', hubId);

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

// POST /api/workspaces - יצירת Workspace (requires hub_id in body)
router.post(
  '/',
  verifyHubAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const hubId = (req as any).hubId || req.body.hub_id;
    const { name, email, phone, company, notes } = req.body;

    if (!hubId) {
      throw new AppError('hub_id is required', 400);
    }

    if (!name) {
      throw new AppError('Workspace name is required', 400);
    }

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ hub_id: hubId, name, email, phone, company, notes })
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
