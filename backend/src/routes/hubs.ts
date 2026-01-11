import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Middleware to extract user from token
const getUserFromToken = async (req: Request): Promise<string> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid authorization header', 401);
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new AppError('Invalid or expired token', 401);
  }

  return user.id;
};

// GET /api/hubs/:id - Get hub details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserFromToken(req);
    const { id } = req.params;

    // Verify membership
    const { data: membership } = await supabase
      .from('hub_members')
      .select('role')
      .eq('hub_id', id)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      throw new AppError('Access denied: Not a member of this hub', 403);
    }

    // Get hub details
    const { data: hub, error } = await supabase
      .from('hubs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json({
      success: true,
      data: {
        ...hub,
        role: membership.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/hubs - Create new hub
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserFromToken(req);
    const { name, type = 'shared', color_theme = 'navy', icon = 'folder' } = req.body;

    if (!name) {
      throw new AppError('Hub name is required', 400);
    }

    // Verify user is approved
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('status')
      .eq('id', userId)
      .single();

    if (!profile || profile.status !== 'approved') {
      throw new AppError('Only approved users can create hubs', 403);
    }

    // Create hub
    const { data: hub, error: hubError } = await supabase
      .from('hubs')
      .insert({
        name,
        type,
        color_theme,
        icon,
        created_by: userId,
      })
      .select()
      .single();

    if (hubError) {
      throw new AppError(hubError.message, 500);
    }

    // Add creator as owner
    const { error: memberError } = await supabase
      .from('hub_members')
      .insert({
        hub_id: hub.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      throw new AppError(memberError.message, 500);
    }

    res.status(201).json({
      success: true,
      data: {
        ...hub,
        role: 'owner',
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/hubs/:id/members - Get hub members
router.get('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserFromToken(req);
    const { id } = req.params;

    // Verify membership
    const { data: membership } = await supabase
      .from('hub_members')
      .select('role')
      .eq('hub_id', id)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      throw new AppError('Access denied: Not a member of this hub', 403);
    }

    // Get members with user profiles
    // We need to join manually because hub_members.user_id -> auth.users
    // and user_profiles.id -> auth.users, so Supabase doesn't see direct relationship
    const { data: members, error: membersError } = await supabase
      .from('hub_members')
      .select('id, role, joined_at, user_id')
      .eq('hub_id', id);

    if (membersError) {
      throw new AppError(membersError.message, 500);
    }

    if (!members || members.length === 0) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    // Get user profiles for all members
    const userIds = members.map((m: any) => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      throw new AppError(profilesError.message, 500);
    }

    // Combine members with their profiles
    const membersWithProfiles = members.map((member: any) => {
      const profile = profiles?.find((p: any) => p.id === member.user_id);
      return {
        id: member.id,
        role: member.role,
        joined_at: member.joined_at,
        user_profiles: profile || null,
      };
    });

    res.json({
      success: true,
      data: membersWithProfiles,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/hubs/:id/members - Add member to hub
router.post('/:id/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserFromToken(req);
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Verify user is owner
    const { data: membership } = await supabase
      .from('hub_members')
      .select('role')
      .eq('hub_id', id)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      throw new AppError('Only hub owners can add members', 403);
    }

    // Find user by email
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .eq('status', 'approved')
      .single();

    if (!userProfile) {
      throw new AppError('User not found or not approved', 404);
    }

    // Add member
    const { data: member, error } = await supabase
      .from('hub_members')
      .insert({
        hub_id: id,
        user_id: userProfile.id,
        role,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new AppError('User is already a member of this hub', 400);
      }
      throw new AppError(error.message, 500);
    }

    res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/hubs/:id/members/:member_id - Remove member from hub
router.delete('/:id/members/:member_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserFromToken(req);
    const { id, member_id } = req.params;

    // Verify user is owner
    const { data: membership } = await supabase
      .from('hub_members')
      .select('role')
      .eq('hub_id', id)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      throw new AppError('Only hub owners can remove members', 403);
    }

    // Prevent removing the owner
    const { data: targetMember } = await supabase
      .from('hub_members')
      .select('role')
      .eq('hub_id', id)
      .eq('user_id', member_id)
      .single();

    if (targetMember?.role === 'owner') {
      throw new AppError('Cannot remove hub owner', 400);
    }

    const { error } = await supabase
      .from('hub_members')
      .delete()
      .eq('hub_id', id)
      .eq('user_id', member_id);

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/hubs/:id - Update hub
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserFromToken(req);
    const { id } = req.params;
    const { name, type, color_theme, icon } = req.body;

    // Verify user is owner
    const { data: membership } = await supabase
      .from('hub_members')
      .select('role')
      .eq('hub_id', id)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      throw new AppError('Only hub owners can update hub', 403);
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (color_theme !== undefined) updateData.color_theme = color_theme;
    if (icon !== undefined) updateData.icon = icon;

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    // Update hub
    const { data: hub, error } = await supabase
      .from('hubs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json({
      success: true,
      data: {
        ...hub,
        role: membership.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/hubs/:id - Delete hub
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserFromToken(req);
    const { id } = req.params;

    // Verify user is owner
    const { data: membership } = await supabase
      .from('hub_members')
      .select('role')
      .eq('hub_id', id)
      .eq('user_id', userId)
      .single();

    if (!membership || membership.role !== 'owner') {
      throw new AppError('Only hub owners can delete hub', 403);
    }

    // Delete hub (cascade will handle hub_members and items)
    const { error } = await supabase
      .from('hubs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(error.message, 500);
    }

    res.json({
      success: true,
      message: 'Hub deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
