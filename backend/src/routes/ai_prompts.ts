import { Router } from 'express';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/prompts
 * Fetch all available AI prompts
 */
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .order('id');
      
    if (error) {
      console.error('Error fetching prompts:', error);
      throw new AppError('Failed to fetch prompts', 500);
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/prompts/:id
 * Update a specific prompt's content and configuration
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, configuration, name, description } = req.body;
    
    if (!content && !configuration && !name && !description) {
      throw new AppError('At least one field to update is required', 400);
    }
    
    const updateData: any = { 
      updated_at: new Date().toISOString()
    };
    
    if (content !== undefined) updateData.content = content;
    if (configuration !== undefined) updateData.configuration = configuration;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    const { data, error } = await supabase
      .from('ai_prompts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating prompt:', error);
      throw new AppError('Failed to update prompt', 500);
    }
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
