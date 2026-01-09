/**
 * Clients Routes
 * ניהול לקוחות - CRUD פשוט
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/clients - כל הלקוחות
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { search, sort = 'name', order = 'asc' } = req.query;

    let query = supabase.from('clients').select('*');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.order(String(sort), { ascending: order === 'asc' });

    const { data, error } = await query;

    if (error) {
      throw new AppError(`Failed to fetch clients: ${error.message}`, 500);
    }

    res.json({ success: true, data });
  })
);

// GET /api/clients/:id - לקוח בודד
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
      .from('clients')
      .select('*, projects(*), meetings(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      throw new AppError('Client not found', 404);
    }

    res.json({ success: true, data });
  })
);

// POST /api/clients - יצירת לקוח
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, company, notes } = req.body;

    if (!name) {
      throw new AppError('Client name is required', 400);
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({ name, email, phone, company, notes })
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to create client: ${error.message}`, 500);
    }

    res.status(201).json({ success: true, data });
  })
);

// PUT /api/clients/:id - עדכון לקוח
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, company, notes } = req.body;

    const { data, error } = await supabase
      .from('clients')
      .update({ name, email, phone, company, notes })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      throw new AppError(`Failed to update client: ${error.message}`, 500);
    }

    res.json({ success: true, data });
  })
);

// DELETE /api/clients/:id - מחיקת לקוח
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw new AppError(`Failed to delete client: ${error.message}`, 500);
    }

    res.json({ success: true, message: 'Client deleted' });
  })
);

export default router;
