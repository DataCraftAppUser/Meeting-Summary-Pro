// ========================================
// Client Types
// ========================================

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
}

// ========================================
// Project Types
// ========================================

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  budget_amount?: number;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface ProjectFormData {
  client_id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  budget_amount?: number;
  hourly_rate?: number;
}

// ========================================
// Action Item Types (✨ חדש)
// ========================================

export interface ActionItem {
  id: string;              // UUID זמני
  task: string;            // שם המשימה
  assignee: string;        // מבצע
  due_date?: string;       // תאריך יעד (אופציונאלי)
}

// ========================================
// Meeting Types
// ========================================

export interface Meeting {
  id: string;
  client_id?: string;
  project_id?: string;
  title: string;
  meeting_date: string;
  meeting_time?: string;                    // ✨ חדש
  participants?: string[];
  content: string;
  processed_content?: string;
  full_raw_content?: string;
  action_items?: ActionItem[];              // ✨ חדש
  follow_up_required?: boolean;             // ✨ חדש
  follow_up_date?: string;                  // ✨ חדש
  follow_up_time?: string;                  // ✨ חדש
  follow_up_tbd?: boolean;                  // ✨ חדש
  status: 'draft' | 'final' | 'archived' | 'processing' | 'processed';
  created_at: string;
  updated_at: string;
  last_edited_at?: string;
  clients?: {
    id: string;
    name: string;
  };
  projects?: {
    id: string;
    name: string;
  };
}

export interface MeetingFormData {
  client_id?: string;
  project_id?: string;
  title: string;
  meeting_date: string;
  meeting_time?: string;                    // ✨ חדש
  participants?: string[];
  content: string;
  action_items?: ActionItem[];              // ✨ חדש
  follow_up_required?: boolean;             // ✨ חדש
  follow_up_date?: string;                  // ✨ חדש
  follow_up_time?: string;                  // ✨ חדש
  follow_up_tbd?: boolean;                  // ✨ חדש
  status?: 'draft' | 'final' | 'archived';
}

export interface MeetingVersion {
  id: string;
  meeting_id: string;
  version_number: number;
  content: string;
  processed_content?: string;
  created_at: string;
  created_by?: string;
}

export interface MeetingTranslation {
  id: string;
  meeting_id: string;
  language: string;
  translated_content: string;
  created_at: string;
}

export interface MeetingFilters {
  client_id?: string;
  project_id?: string;
  status?: string;
  search?: string;
}

// ========================================
// Time Entry Types
// ========================================

export interface TimeEntry {
  id: string;
  project_id: string;
  meeting_id?: string;
  user_id?: string;
  description: string;
  hours: number;
  entry_date: string;
  is_billable: boolean;
  created_at: string;
  updated_at: string;
}

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ========================================
// AI Processing Types
// ========================================

export interface ProcessMeetingRequest {
  meeting_id: string;
  content: string;
}

export interface ProcessMeetingResponse {
  meeting_id: string;
  processed_content: string;
  status: string;
}

// ========================================
// Toast/Notification Types
// ========================================

export interface ToastMessage {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}
