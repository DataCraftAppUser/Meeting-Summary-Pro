// ========================================
// Workspace Types
// ========================================

export interface Workspace {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceFormData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}

// ========================================
// Topic Types
// ========================================

export interface Topic {
  id: string;
  workspace_id: string | null;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string;
  deadline?: string;
  estimated_hours?: number;
  budget_amount?: number;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
  workspaces?: Workspace;
}

export interface TopicFormData {
  workspace_id: string;
  name: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string;
  deadline?: string;
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
// Item Types
// ========================================

export interface Item {
  id: string;
  workspace_id?: string;
  topic_id?: string;
  title: string;
  meeting_date: string;
  meeting_time?: string;
  participants?: string[];
    content_type?: 'meeting' | 'work_log' | 'knowledge_item';
    content: string;
    processed_content?: string;
    full_raw_content?: string;
    action_items?: ActionItem[];
    follow_up_required?: boolean;
    follow_up_date?: string;
    follow_up_time?: string;
    follow_up_tbd?: boolean;
    is_processed_manually_updated?: boolean;
    processed_by?: string;
    status: 'draft' | 'final' | 'archived' | 'processing' | 'processed';
    created_at: string;
    updated_at: string;
    last_edited_at?: string;
    workspaces?: {
      id: string;
      name: string;
    };
    topics?: {
      id: string;
      name: string;
    };
  }
  
  export interface ItemFormData {
    workspace_id?: string;
    topic_id?: string;
    title: string;
    meeting_date: string;
    meeting_time?: string;
    participants?: string[];
    content_type?: 'meeting' | 'work_log' | 'knowledge_item';
    content: string;
  processed_content?: string;
  full_raw_content?: string;
  action_items?: ActionItem[];
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_time?: string;
  follow_up_tbd?: boolean;
  is_processed_manually_updated?: boolean;
  status?: 'draft' | 'final' | 'archived' | 'processing' | 'processed';
}

export interface ItemVersion {
  id: string;
  item_id: string;
  version_number: number;
  content: string;
  processed_content?: string;
  created_at: string;
  created_by?: string;
}

export interface ItemTranslation {
  id: string;
  item_id: string;
  language: string;
  translated_content: string;
  translated_processed_content?: string;
  created_at: string;
}

export interface ItemFilters {
  workspace_id?: string;
  topic_id?: string;
  status?: string;
  content_type?: string;
  search?: string;
}

// ========================================
// Time Entry Types
// ========================================

export interface TimeEntry {
  id: string;
  topic_id: string;
  item_id?: string;
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

export interface ProcessItemRequest {
  item_id: string;
  content: string;
}

export interface ProcessItemResponse {
  item_id: string;
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
