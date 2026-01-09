import { useState, useCallback } from 'react';
import api from '../services/api';
import { Project, ProjectFormData } from '../types';
import { useToast } from './useToast';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchProjects = useCallback(
    async (clientId?: string) => {
      setLoading(true);
      try {
        const response = await api.getProjects({
          limit: 1000,
          client_id: clientId,
        });
        setProjects(response.data);
      } catch (error: any) {
        showToast('שגיאה בטעינת פרויקטים', 'error');
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const getProject = useCallback(
    async (id: string): Promise<Project | null> => {
      setLoading(true);
      try {
        const project = await api.getProject(id);
        return project;
      } catch (error: any) {
        showToast('שגיאה בטעינת פרויקט', 'error');
        console.error('Error fetching project:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const createProject = useCallback(
    async (data: ProjectFormData): Promise<Project | null> => {
      setLoading(true);
      try {
        const project = await api.createProject(data);
        showToast('פרויקט נוצר בהצלחה', 'success');
        await fetchProjects(data.client_id); // Refresh list
        return project;
      } catch (error: any) {
        showToast('שגיאה ביצירת פרויקט', 'error');
        console.error('Error creating project:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchProjects]
  );

  const updateProject = useCallback(
    async (id: string, data: Partial<ProjectFormData>): Promise<Project | null> => {
      setLoading(true);
      try {
        const project = await api.updateProject(id, data);
        showToast('פרויקט עודכן בהצלחה', 'success');
        await fetchProjects(data.client_id); // Refresh list
        return project;
      } catch (error: any) {
        showToast('שגיאה בעדכון פרויקט', 'error');
        console.error('Error updating project:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchProjects]
  );

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      try {
        await api.deleteProject(id);
        showToast('פרויקט נמחק בהצלחה', 'success');
        await fetchProjects(); // Refresh list
        return true;
      } catch (error: any) {
        showToast('שגיאה במחיקת פרויקט', 'error');
        console.error('Error deleting project:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchProjects]
  );

  return {
    projects,
    loading,
    fetchProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
  };
}
