import { useState, useCallback } from 'react';
import api from '../services/api';
import { Hub } from '../types';
import { useToast } from './useToast';

export interface HubMember {
  id: string;
  role: 'owner' | 'member';
  joined_at: string;
  user_profiles: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export function useHubs() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const updateHub = useCallback(
    async (id: string, data: { name?: string; type?: 'personal' | 'shared'; color_theme?: 'green' | 'navy'; icon?: string }): Promise<Hub | null> => {
      setLoading(true);
      try {
        const hub = await api.updateHub(id, data);
        showToast('Hub עודכן בהצלחה', 'success');
        return hub;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'שגיאה בעדכון Hub';
        showToast(errorMessage, 'error');
        console.error('Error updating hub:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const deleteHub = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      try {
        await api.deleteHub(id);
        showToast('Hub נמחק בהצלחה', 'success');
        return true;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'שגיאה במחיקת Hub';
        showToast(errorMessage, 'error');
        console.error('Error deleting hub:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const getHubMembers = useCallback(
    async (hubId: string): Promise<HubMember[]> => {
      setLoading(true);
      try {
        const members = await api.getHubMembers(hubId);
        // Ensure we return an array
        if (!Array.isArray(members)) {
          console.warn('getHubMembers returned non-array:', members);
          return [];
        }
        return members;
      } catch (error: any) {
        let errorMessage = 'שגיאה בטעינת חברי Hub';
        if (error?.response?.data?.error) {
          const err = error.response.data.error;
          errorMessage = typeof err === 'string' ? err : err?.message || errorMessage;
        } else if (error?.message) {
          errorMessage = typeof error.message === 'string' ? error.message : errorMessage;
        }
        showToast(errorMessage, 'error');
        console.error('Error fetching hub members:', error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const addHubMember = useCallback(
    async (hubId: string, email: string, role: 'owner' | 'member' = 'member'): Promise<boolean> => {
      setLoading(true);
      try {
        await api.addHubMember(hubId, email, role);
        showToast('חבר נוסף ל-Hub בהצלחה', 'success');
        return true;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'שגיאה בהוספת חבר ל-Hub';
        showToast(errorMessage, 'error');
        console.error('Error adding hub member:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const removeHubMember = useCallback(
    async (hubId: string, memberId: string): Promise<boolean> => {
      setLoading(true);
      try {
        await api.removeHubMember(hubId, memberId);
        showToast('חבר הוסר מ-Hub בהצלחה', 'success');
        return true;
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'שגיאה בהסרת חבר מ-Hub';
        showToast(errorMessage, 'error');
        console.error('Error removing hub member:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  return {
    loading,
    updateHub,
    deleteHub,
    getHubMembers,
    addHubMember,
    removeHubMember,
  };
}
