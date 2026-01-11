import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from './errorHandler';

/**
 * Middleware to verify user has access to the hub specified in the request
 * Expects hub_id in req.params or req.body
 */
export const verifyHubAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', 401);
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Get hub_id from params, body, or query
    const hubId = req.params.hub_id || req.body.hub_id || req.query.hub_id;
    if (!hubId) {
      throw new AppError('hub_id is required', 400);
    }

    // Check hub membership
    const { data: membership, error } = await supabase
      .from('hub_members')
      .select('role')
      .eq('hub_id', hubId)
      .eq('user_id', user.id)
      .single();

    if (error || !membership) {
      throw new AppError('Access denied: Not a member of this hub', 403);
    }

    // Attach user and membership info to request
    (req as any).user = user;
    (req as any).hubMembership = membership;
    (req as any).hubId = hubId;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to extract user from token (without hub check)
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid authorization header', 401);
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    // Check if user is approved
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.status !== 'approved') {
      throw new AppError('Account pending approval', 403);
    }

    (req as any).user = user;
    next();
  } catch (error) {
    next(error);
  }
};
