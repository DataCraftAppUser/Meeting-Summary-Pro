import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Debug: Log which Supabase project we're connecting to
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Supabase Connection Debug:');
  console.log('URL:', supabaseUrl || 'NOT SET');
  console.log('Project ID:', supabaseUrl ? supabaseUrl.split('//')[1]?.split('.')[0] : 'NOT SET');
  console.log('Has Anon Key:', !!supabaseAnonKey);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please create frontend/.env file with:');
  console.error('REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('REACT_APP_SUPABASE_ANON_KEY=your-anon-key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Use default storage key for consistency
  },
});
