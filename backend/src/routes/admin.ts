import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Middleware to verify admin
const requireAdmin = async (req: Request): Promise<string> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid authorization header', 401);
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new AppError('Invalid or expired token', 401);
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_admin) {
    throw new AppError('Admin access required', 403);
  }

  return user.id;
};

// GET /api/admin/pending-users - Get pending users
router.get('/pending-users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireAdmin(req);

    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json({
      success: true,
      data: users || [],
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/approve-user/:id - Approve user
router.post('/approve-user/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireAdmin(req);
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('user_profiles')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(error.message, 500);
    }

    // The trigger will automatically create a personal hub
    res.json({
      success: true,
      data: user,
      message: 'User approved and personal hub created',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/reject-user/:id - Reject user
router.post('/reject-user/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireAdmin(req);
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('user_profiles')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json({
      success: true,
      data: user,
      message: 'User rejected',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/all-users - Get all users (admin only)
router.get('/all-users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireAdmin(req);

    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json({
      success: true,
      data: users || [],
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/make-admin/:id - Make user admin
router.post('/make-admin/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await requireAdmin(req);
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('user_profiles')
      .update({ is_admin: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json({
      success: true,
      data: user,
      message: 'User promoted to admin',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
