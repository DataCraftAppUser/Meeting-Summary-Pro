import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/auth/user - Get current user profile
router.get('/user', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', 401);
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      throw new AppError(profileError.message, 500);
    }

    // If profile doesn't exist, create one (for existing users)
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          status: 'pending',
          is_admin: false,
        })
        .select()
        .single();

      if (createError) {
        throw new AppError(createError.message, 500);
      }

      return res.json({
        success: true,
        data: {
          ...newProfile,
          email: user.email,
        },
      });
    }

    res.json({
      success: true,
      data: {
        ...profile,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/hubs - Get user's hubs
router.get('/hubs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('📥 GET /api/auth/hubs - Request received');
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      throw new AppError('Missing or invalid authorization header', 401);
    }

    const token = authHeader.substring(7);
    console.log('🔍 Verifying token...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('❌ Token verification failed:', authError?.message);
      throw new AppError('Invalid or expired token', 401);
    }

    console.log('✅ Token verified, user ID:', user.id);
    console.log('🔍 Fetching user hubs...');

    // Get user's hubs
    const { data: hubs, error } = await supabase
      .from('hub_members')
      .select(`
        hub_id,
        role,
        hubs (
          id,
          name,
          type,
          color_theme,
          icon,
          created_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error fetching hubs:', error);
      throw new AppError(error.message, 500);
    }

    const formattedHubs = hubs?.map((hm: any) => ({
      ...hm.hubs,
      role: hm.role,
    })) || [];

    console.log('✅ Hubs fetched:', formattedHubs.length, 'hubs');
    res.json({
      success: true,
      data: formattedHubs,
    });
  } catch (error) {
    console.error('❌ Error in /api/auth/hubs:', error);
    next(error);
  }
});

// POST /api/auth/verify-hub-access - Verify user has access to hub
router.post('/verify-hub-access', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hub_id } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', 401);
    }

    if (!hub_id) {
      throw new AppError('hub_id is required', 400);
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Check hub membership
    const { data: membership, error } = await supabase
      .from('hub_members')
      .select('role')
      .eq('hub_id', hub_id)
      .eq('user_id', user.id)
      .single();

    if (error || !membership) {
      throw new AppError('Access denied: Not a member of this hub', 403);
    }

    res.json({
      success: true,
      data: {
        has_access: true,
        role: membership.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
