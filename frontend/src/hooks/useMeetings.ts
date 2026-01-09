import { useState, useCallback } from 'react';
import api from '../services/api';
import { Meeting, MeetingFormData, MeetingFilters } from '../types';
import { useToast } from './useToast';

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { showToast } = useToast();

  const fetchMeetings = useCallback(
    async (filters?: MeetingFilters) => {
      setLoading(true);
      try {
        const response = await api.getMeetings({
          page,
          limit,
          ...filters,
        });
        setMeetings(response.data);
        setTotal(response.pagination.total);
      } catch (error: any) {
        showToast('שגיאה בטעינת סיכומים', 'error');
        console.error('Error fetching meetings:', error);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, showToast]
  );

  const getMeeting = useCallback(
    async (id: string): Promise<Meeting | null> => {
      setLoading(true);
      try {
        const meeting = await api.getMeeting(id);
        console.log('✅ getMeeting result:', meeting);
        return meeting;
      } catch (error: any) {
        showToast('שגיאה בטעינת סיכום', 'error');
        console.error('Error fetching meeting:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const createMeeting = useCallback(
    async (data: MeetingFormData): Promise<Meeting | null> => {
      setLoading(true);
      try {
        const response = await api.createMeeting(data);
        
        console.log('✅ createMeeting API response:', response);
        
        // ✅ תיקון: החזר את data ישירות אם הוא קיים
        const meeting = (response as any)?.data || response;
        
        console.log('✅ Extracted meeting:', meeting);
        
        showToast('סיכום נוצר בהצלחה', 'success');
        return meeting;
      } catch (error: any) {
        console.error('❌ Error creating meeting:', error);
        showToast('שגיאה ביצירת סיכום', 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const updateMeeting = useCallback(
    async (id: string, data: Partial<MeetingFormData>): Promise<Meeting | null> => {
      setLoading(true);
      try {
        const response = await api.updateMeeting(id, data);
        
        // ✅ תיקון: החזר את data ישירות
        const meeting = (response as any)?.data || response;
        
        showToast('סיכום עודכן בהצלחה', 'success');
        return meeting;
      } catch (error: any) {
        showToast('שגיאה בעדכון סיכום', 'error');
        console.error('Error updating meeting:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const deleteMeeting = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      try {
        await api.deleteMeeting(id);
        showToast('סיכום נמחק בהצלחה', 'success');
        return true;
      } catch (error: any) {
        showToast('שגיאה במחיקת סיכום', 'error');
        console.error('Error deleting meeting:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const processMeeting = useCallback(
    async (meetingId: string, content: string): Promise<Meeting | null> => {
      try {
        const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // ✅ תיקון: החזר את data מהתשובה
        console.log('✅ processMeeting result:', result);
        const meeting = result.data || result;
        console.log('✅ Extracted meeting:', meeting);
        
        return meeting;
      } catch (error: any) {
        showToast('שגיאה בעיבוד סיכום', 'error');
        console.error('Error processing meeting:', error);
        return null;
      }
    },
    [showToast]
  );

  const translateMeeting = useCallback(
    async (meetingId: string, language: string = 'en') => {
      try {
        const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}/translate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ language }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // ✅ תיקון: החזר את data
        console.log('✅ translateMeeting result:', result);
        return result.data || result;
      } catch (error: any) {
        showToast('שגיאה בתרגום', 'error');
        console.error('Error translating meeting:', error);
        return null;
      }
    },
    [showToast]
  );

  return {
    meetings,
    loading,
    total,
    page,
    limit,
    setPage,
    fetchMeetings,
    getMeeting,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    processMeeting,
    translateMeeting,
  };
}
