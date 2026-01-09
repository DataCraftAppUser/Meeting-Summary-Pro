import { useState, useCallback } from 'react';
import api from '../services/api';
import { Client, ClientFormData } from '../types';
import { useToast } from './useToast';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getClients({ limit: 1000 });
      setClients(response.data);
    } catch (error: any) {
      showToast('שגיאה בטעינת לקוחות', 'error');
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const getClient = useCallback(
    async (id: string): Promise<Client | null> => {
      setLoading(true);
      try {
        const client = await api.getClient(id);
        return client;
      } catch (error: any) {
        showToast('שגיאה בטעינת לקוח', 'error');
        console.error('Error fetching client:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const createClient = useCallback(
    async (data: ClientFormData): Promise<Client | null> => {
      setLoading(true);
      try {
        const client = await api.createClient(data);
        showToast('לקוח נוצר בהצלחה', 'success');
        await fetchClients(); // Refresh list
        return client;
      } catch (error: any) {
        showToast('שגיאה ביצירת לקוח', 'error');
        console.error('Error creating client:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchClients]
  );

  const updateClient = useCallback(
    async (id: string, data: Partial<ClientFormData>): Promise<Client | null> => {
      setLoading(true);
      try {
        const client = await api.updateClient(id, data);
        showToast('לקוח עודכן בהצלחה', 'success');
        await fetchClients(); // Refresh list
        return client;
      } catch (error: any) {
        showToast('שגיאה בעדכון לקוח', 'error');
        console.error('Error updating client:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchClients]
  );

  const deleteClient = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      try {
        await api.deleteClient(id);
        showToast('לקוח נמחק בהצלחה', 'success');
        await fetchClients(); // Refresh list
        return true;
      } catch (error: any) {
        showToast('שגיאה במחיקת לקוח', 'error');
        console.error('Error deleting client:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast, fetchClients]
  );

  return {
    clients,
    loading,
    fetchClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
  };
}
