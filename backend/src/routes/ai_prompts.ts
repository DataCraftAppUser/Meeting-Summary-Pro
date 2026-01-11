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
 * Update a specific prompt's content
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      throw new AppError('Prompt content is required', 400);
    }
    
    const { data, error } = await supabase
      .from('ai_prompts')
      .update({ 
        content,
        updated_at: new Date().toISOString()
      })
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
