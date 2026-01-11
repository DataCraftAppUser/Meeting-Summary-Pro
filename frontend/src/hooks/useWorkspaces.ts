import { useState, useCallback } from 'react';
import api from '../services/api';
import { Workspace, WorkspaceFormData } from '../types';
import { useToast } from './useToast';

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchWorkspaces = useCallback(async (hubId?: string) => {
    setLoading(true);
    try {
      if (!hubId) {
        throw new Error('hub_id is required');
      }
      const response = await api.getWorkspaces({ hub_id: hubId, limit: 1000 });
      setWorkspaces(response.data);
    } catch (error: any) {
      showToast('שגיאה בטעינת עולמות תוכן', 'error');
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const getWorkspace = useCallback(
    async (id: string): Promise<Workspace | null> => {
      setLoading(true);
      try {
        const workspace = await api.getWorkspace(id);
        return workspace;
      } catch (error: any) {
        showToast('שגיאה בטעינת עולם תוכן', 'error');
        console.error('Error fetching workspace:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const createWorkspace = useCallback(
    async (data: WorkspaceFormData & { hub_id?: string }, hubId?: string): Promise<Workspace | null> => {
      setLoading(true);
      try {
        const hub_id = hubId || data.hub_id;
        if (!hub_id) {
          throw new Error('hub_id is required');
        }
        const workspace = await api.createWorkspace({ ...data, hub_id });
        showToast('עולם תוכן נוצר בהצלחה', 'success');
        await fetchWorkspaces(hub_id); // Refresh list
        return workspace;
      } catch (error: any) {
        showToast('שגיאה ביצירת עולם תוכן', 'error');
        console.error('Error creating workspace:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchWorkspaces]
  );

  const updateWorkspace = useCallback(
    async (id: string, data: Partial<WorkspaceFormData>, hubId?: string): Promise<Workspace | null> => {
      setLoading(true);
      try {
        const workspace = await api.updateWorkspace(id, data);
        showToast('עולם תוכן עודכן בהצלחה', 'success');
        if (hubId) {
          await fetchWorkspaces(hubId); // Refresh list
        }
        return workspace;
      } catch (error: any) {
        showToast('שגיאה בעדכון עולם תוכן', 'error');
        console.error('Error updating workspace:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchWorkspaces]
  );

  const deleteWorkspace = useCallback(
    async (id: string, hubId?: string): Promise<boolean> => {
      setLoading(true);
      try {
        await api.deleteWorkspace(id);
        showToast('עולם תוכן נמחק בהצלחה', 'success');
        if (hubId) {
          await fetchWorkspaces(hubId); // Refresh list
        }
        return true;
      } catch (error: any) {
        showToast('שגיאה במחיקת עולם תוכן', 'error');
        console.error('Error deleting workspace:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchWorkspaces]
  );

  return {
    workspaces,
    loading,
    fetchWorkspaces,
    getWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  };
}
