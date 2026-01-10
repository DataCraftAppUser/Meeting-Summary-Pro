import { useState, useCallback } from 'react';
import api from '../services/api';
import { Workspace, WorkspaceFormData } from '../types';
import { useToast } from './useToast';

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getWorkspaces({ limit: 1000 });
      setWorkspaces(response.data);
    } catch (error: any) {
      showToast('שגיאה בטעינת Workspaces', 'error');
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
        showToast('שגיאה בטעינת Workspace', 'error');
        console.error('Error fetching workspace:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const createWorkspace = useCallback(
    async (data: WorkspaceFormData): Promise<Workspace | null> => {
      setLoading(true);
      try {
        const workspace = await api.createWorkspace(data);
        showToast('Workspace נוצר בהצלחה', 'success');
        await fetchWorkspaces(); // Refresh list
        return workspace;
      } catch (error: any) {
        showToast('שגיאה ביצירת Workspace', 'error');
        console.error('Error creating workspace:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchWorkspaces]
  );

  const updateWorkspace = useCallback(
    async (id: string, data: Partial<WorkspaceFormData>): Promise<Workspace | null> => {
      setLoading(true);
      try {
        const workspace = await api.updateWorkspace(id, data);
        showToast('Workspace עודכן בהצלחה', 'success');
        await fetchWorkspaces(); // Refresh list
        return workspace;
      } catch (error: any) {
        showToast('שגיאה בעדכון Workspace', 'error');
        console.error('Error updating workspace:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchWorkspaces]
  );

  const deleteWorkspace = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      try {
        await api.deleteWorkspace(id);
        showToast('Workspace נמחק בהצלחה', 'success');
        await fetchWorkspaces(); // Refresh list
        return true;
      } catch (error: any) {
        showToast('שגיאה במחיקת Workspace', 'error');
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
