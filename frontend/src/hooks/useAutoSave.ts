import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  onSave: () => void | Promise<void>;
  delay?: number; // milliseconds
  enabled?: boolean;
}

export function useAutoSave({ onSave, delay = 60000, enabled = true }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);

  const scheduleAutoSave = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new auto-save
    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;

      try {
        isSavingRef.current = true;
        await onSave();
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        isSavingRef.current = false;
      }
    }, delay);
  }, [onSave, delay, enabled]);

  const triggerAutoSave = useCallback(() => {
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    triggerAutoSave,
    cancelAutoSave,
    scheduleAutoSave,
  };
}
