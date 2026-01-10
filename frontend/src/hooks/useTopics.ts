import { useState, useCallback } from 'react';
import api from '../services/api';
import { Topic, TopicFormData } from '../types';
import { useToast } from './useToast';

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchTopics = useCallback(
    async (workspaceId?: string) => {
      setLoading(true);
      try {
        const response = await api.getTopics({
          limit: 1000,
          workspace_id: workspaceId,
        });
        setTopics(response.data);
      } catch (error: any) {
        showToast('שגיאה בטעינת נושאים', 'error');
        console.error('Error fetching topics:', error);
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const getTopic = useCallback(
    async (id: string): Promise<Topic | null> => {
      setLoading(true);
      try {
        const topic = await api.getTopic(id);
        return topic;
      } catch (error: any) {
        showToast('שגיאה בטעינת נושא', 'error');
        console.error('Error fetching topic:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const createTopic = useCallback(
    async (data: TopicFormData): Promise<Topic | null> => {
      setLoading(true);
      try {
        const topic = await api.createTopic(data);
        showToast('נושא נוצר בהצלחה', 'success');
        await fetchTopics(data.workspace_id); // Refresh list
        return topic;
      } catch (error: any) {
        showToast('שגיאה ביצירת נושא', 'error');
        console.error('Error creating topic:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchTopics]
  );

  const updateTopic = useCallback(
    async (id: string, data: Partial<TopicFormData>): Promise<Topic | null> => {
      setLoading(true);
      try {
        const topic = await api.updateTopic(id, data);
        showToast('נושא עודכן בהצלחה', 'success');
        await fetchTopics(data.workspace_id); // Refresh list
        return topic;
      } catch (error: any) {
        showToast('שגיאה בעדכון נושא', 'error');
        console.error('Error updating topic:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchTopics]
  );

  const deleteTopic = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      try {
        await api.deleteTopic(id);
        showToast('נושא נמחק בהצלחה', 'success');
        await fetchTopics(); // Refresh list
        return true;
      } catch (error: any) {
        showToast('שגיאה במחיקת נושא', 'error');
        console.error('Error deleting topic:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchTopics]
  );

  return {
    topics,
    loading,
    fetchTopics,
    getTopic,
    createTopic,
    updateTopic,
    deleteTopic,
  };
}
