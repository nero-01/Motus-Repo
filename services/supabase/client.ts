import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../config/env';

// console.log('Initializing Supabase client with:', {
//   url: ENV.SUPABASE_URL,
//   hasKey: !!ENV.SUPABASE_ANON_KEY,
// });

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Add error handling to Supabase client
supabase.auth.onAuthStateChange((event, session) => {
  // console.log('Supabase auth state change:', event, session?.user?.id || 'no user');
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', ENV.SUPABASE_URL);
    console.log('Key exists:', !!ENV.SUPABASE_ANON_KEY);
    
    // First test if we can access the auth system
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth test result:', { user: user?.id, authError });
    
    // Then test if we can access the families table
    const { data, error } = await supabase
      .from('families')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error, authError };
    }
    
    console.log('Supabase connection test successful');
    return { success: true, data, authError };
  } catch (error) {
    console.error('Supabase connection test exception:', error);
    return { success: false, error };
  }
};

// Test database schema function
export const testDatabaseSchema = async () => {
  try {
    console.log('Testing database schema...');
    
    const requiredTables = [
      'users',
      'families', 
      'family_members',
      'children',
      'routines',
      'tasks',
      'task_completions',
      'worksheets',
      'worksheet_progress',
      'rewards',
      'child_rewards',
      'points_log',
      'calendar_events',
      'custody_schedule',
      'chores',
      'chore_assignments',
      'meals',
      'meal_plans',
      'expenses',
      'messages'
    ];
    
    const results: Record<string, { exists: boolean; error?: string }> = {};
    
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        results[table] = { exists: !error, error: error?.message };
      } catch (err) {
        results[table] = { exists: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    }
    
    console.log('Database schema test results:', results);
    
    const missingTables = Object.entries(results)
      .filter(([table, result]) => !result.exists)
      .map(([table]) => table);
    
    if (missingTables.length > 0) {
      return { 
        success: false, 
        missingTables,
        results 
      };
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Database schema test exception:', error);
    return { success: false, error };
  }
};

// Database types (will be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          avatar_url: string | null;
          role: 'parent' | 'co_parent' | 'admin';
          subscription_tier: 'free' | 'premium';
          subscription_expires_at: string | null;
          is_onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          avatar_url?: string | null;
          role?: 'parent' | 'co_parent' | 'admin';
          subscription_tier?: 'free' | 'premium';
          subscription_expires_at?: string | null;
          is_onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string | null;
          role?: 'parent' | 'co_parent' | 'admin';
          subscription_tier?: 'free' | 'premium';
          subscription_expires_at?: string | null;
          is_onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      families: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add more table types as needed
    };
  };
} 