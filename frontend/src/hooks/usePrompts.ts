import { useState, useCallback } from 'react';
import apiService from '../services/api';

export interface Prompt {
  id: string;
  name: string;
  content: string;
  description: string;
  configuration?: any;
  updated_at: string;
}

export const usePrompts = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getPrompts();
      setPrompts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prompts');
      console.error('Error fetching prompts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePrompt = async (id: string, content: string, configuration?: any): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiService.updatePrompt(id, content, configuration);
      await fetchPrompts();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update prompt');
      console.error('Error updating prompt:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    prompts,
    loading,
    error,
    fetchPrompts,
    updatePrompt,
  };
};
