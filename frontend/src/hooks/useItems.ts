import { useState, useCallback } from 'react';
import api from '../services/api';
import { Item, ItemFormData, ItemFilters } from '../types';
import { useToast } from './useToast';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { showToast } = useToast();

  const fetchItems = useCallback(
    async (filters?: ItemFilters & { hub_id?: string }) => {
      console.log('🔄 fetchItems called with filters:', filters);
      setLoading(true);
      try {
        const params = {
          page,
          limit,
          ...filters,
        };
        console.log('📡 Calling api.getItems with params:', params);
        const response = await api.getItems(params);
        console.log('📥 API response received:', response);
        setItems(response.data);
        setTotal(response.pagination.total);
        console.log('✅ Items loaded:', response.data.length, 'items, total:', response.pagination.total);
      } catch (error: any) {
        console.error('❌ Error fetching items:', error);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        } else if (error.request) {
          console.error('No response received:', error.request);
        }
        showToast('שגיאה בטעינת פריטים', 'error');
      } finally {
        setLoading(false);
      }
    },
    [page, limit, showToast]
  );

  const getItem = useCallback(
    async (id: string, hubId: string): Promise<Item | null> => {
      setLoading(true);
      try {
        const item = await api.getItem(id, hubId);
        console.log('✅ getItem result:', item);
        return item;
      } catch (error: any) {
        showToast('שגיאה בטעינת פריט', 'error');
        console.error('Error fetching item:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const createItem = useCallback(
    async (data: ItemFormData & { hub_id: string }): Promise<Item | null> => {
      setLoading(true);
      try {
        const response = await api.createItem(data);
        
        console.log('✅ createItem API response:', response);
        
        const item = (response as any)?.data || response;
        
        console.log('✅ Extracted item:', item);
        
        showToast('פריט נוצר בהצלחה', 'success');
        return item;
      } catch (error: any) {
        console.error('❌ Error creating item:', error);
        showToast('שגיאה ביצירת פריט', 'error');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const updateItem = useCallback(
    async (id: string, data: Partial<ItemFormData> & { hub_id: string }): Promise<Item | null> => {
      setLoading(true);
      try {
        const item = await api.updateItem(id, data);
        showToast('פריט עודכן בהצלחה', 'success');
        return item;
      } catch (error: any) {
        let errorMessage = 'שגיאה בעדכון פריט';
        if (error.response?.data?.error) {
          errorMessage = typeof error.response.data.error === 'string' 
            ? error.response.data.error 
            : error.response.data.error.message || JSON.stringify(error.response.data.error);
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        showToast(errorMessage, 'error');
        console.error('Error updating item:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const deleteItem = useCallback(
    async (id: string, hubId: string): Promise<boolean> => {
      setLoading(true);
      try {
        await api.deleteItem(id, hubId);
        showToast('פריט נמחק בהצלחה', 'success');
        return true;
      } catch (error: any) {
        showToast('שגיאה במחיקת פריט', 'error');
        console.error('Error deleting item:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const processItem = useCallback(
    async (itemId: string, hubId: string): Promise<Item | null> => {
      try {
        const result = await api.processItem(itemId, hubId);

        console.log('✅ processItem result:', result);
        const item = (result as any).data || result;
        console.log('✅ Extracted item:', item);

        return item;
      } catch (error: any) {
        showToast('שגיאה בעיבוד פריט', 'error');
        console.error('Error processing item:', error);
        return null;
      }
    },
    [showToast]
  );

  const translateItem = useCallback(
    async (itemId: string, hubId: string, language: string = 'en') => {
      try {
        const result = await api.translateItem(itemId, hubId, language);

        console.log('✅ translateItem result:', result);
        return (result as any).data || result;
      } catch (error: any) {
        showToast('שגיאה בתרגום', 'error');
        console.error('Error translating item:', error);
        return null;
      }
    },
    [showToast]
  );

  return {
    items,
    loading,
    total,
    page,
    limit,
    setPage,
    fetchItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    processItem,
    translateItem,
  };
}
