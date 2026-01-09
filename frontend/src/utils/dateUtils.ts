import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

/**
 * פונקציה מתוקנת לפרסור תאריכים מSupabase
 */
function parseDateSafely(date: string | Date | null | undefined): Date | null {
  // בדיקה ראשונה: אם התאריך null או undefined
  if (!date) {
    return null;
  }

  if (date instanceof Date) {
    return date;
  }

  try {
    // נסה parseISO רגיל
    const parsed = parseISO(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (e) {
    // אם נכשל, המשך לשיטה הבאה
  }

  try {
    // אם יש רווח במקום T, החלף אותו
    const normalized = date.replace(' ', 'T');
    const parsed = parseISO(normalized);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (e) {
    // אם נכשל, המשך לשיטה הבאה
  }

  try {
    // נסה new Date() ישירות
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (e) {
    // כשל סופי
  }

  // אם כל הניסיונות נכשלו
  console.error('Failed to parse date:', date);
  return null;
}

export function formatDate(date: string | Date | null | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    const dateObj = parseDateSafely(date);
    
    // אם התאריך null או לא תקין, החזר מחרוזת ריקה
    if (!dateObj || isNaN(dateObj.getTime())) {
      return '';
    }
    
    return format(dateObj, formatStr, { locale: he });
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', date);
    return '';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

export function formatTimeAgo(date: string | Date | null | undefined): string {
  try {
    const dateObj = parseDateSafely(date);
    
    // אם התאריך null או לא תקין, החזר מחרוזת ריקה
    if (!dateObj || isNaN(dateObj.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'כרגע';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    
    return formatDate(dateObj);
  } catch (error) {
    console.error('Error formatting time ago:', error, 'Input:', date);
    return '';
  }
}

export function isToday(date: string | Date | null | undefined): boolean {
  try {
    const dateObj = parseDateSafely(date);
    
    // אם התאריך null או לא תקין
    if (!dateObj || isNaN(dateObj.getTime())) {
      return false;
    }
    
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error('Error in isToday:', error, 'Input:', date);
    return false;
  }
}
