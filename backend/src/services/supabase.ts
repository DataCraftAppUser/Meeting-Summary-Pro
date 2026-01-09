/**
 * Supabase Client Configuration
 * יצירת client עם service_role למשימות backend
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
}

// Create Supabase client with service_role key
// ⚠️ This bypasses Row Level Security - use carefully!
export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Helper: Test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('clients').select('count').single();
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
};

// Database types (אוטומטי מ-Supabase CLI אם רוצים)
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      projects: {
        Row: {
          id: string;
          client_id: string | null;
          name: string;
          description: string | null;
          status: string;
          estimated_hours: number | null;
          budget_amount: number | null;
          hourly_rate: number | null;
          start_date: string | null;
          deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      meetings: {
        Row: {
          id: string;
          client_id: string | null;
          project_id: string | null;
          title: string;
          meeting_date: string;
          participants: string[];
          content: string;
          processed_content: string | null;
          status: string;
          duration_minutes: number | null;
          meeting_location: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          last_edited_at: string;
        };
        Insert: Omit<Database['public']['Tables']['meetings']['Row'], 'id' | 'created_at' | 'updated_at' | 'last_edited_at'>;
        Update: Partial<Database['public']['Tables']['meetings']['Insert']>;
      };
    };
  };
}

export default supabase;
