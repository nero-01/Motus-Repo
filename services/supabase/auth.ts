import { supabase } from './client';
import { AuthError, User } from '@supabase/supabase-js';
import { ENV } from '../../config/env';
import { formatAuthError } from './authErrors';

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

// Mock user for testing without Supabase
const createMockUser = (email: string, firstName: string, lastName: string): User => ({
  id: `mock-${Date.now()}`,
  email,
  user_metadata: {
    first_name: firstName,
    last_name: lastName,
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  phone: undefined,
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  role: 'authenticated',
});

// Check if we're in mock mode (no valid Supabase URL or explicitly set)
const isMockMode = () => {
  console.log('Mock mode check:', {
    forceMock: ENV.FORCE_MOCK,
    supabaseUrl: ENV.SUPABASE_URL,
    isDefaultUrl: ENV.SUPABASE_URL === 'https://your-project.supabase.co'
  });
  
  return ENV.FORCE_MOCK || !ENV.SUPABASE_URL || ENV.SUPABASE_URL === 'https://your-project.supabase.co';
};

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<AuthResponse> {
    try {
      console.log('Starting signup process...');
      console.log('Mock mode:', isMockMode());
      
      if (isMockMode()) {
        // Mock signup for testing
        console.log('Mock signup:', { email, firstName, lastName });
        const mockUser = createMockUser(email, firstName, lastName);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { user: mockUser, error: null };
      }

      console.log('Attempting Supabase signup...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        console.error('Supabase signup error:', error);
        return { user: null, error };
      }

      // The user profile will be created automatically by the database trigger
      // No need to manually insert into users table
      console.log('User signed up successfully:', data.user?.id);

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Signup exception:', error);
      return { user: null, error: error as AuthError };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Starting signin process...');
      console.log('Mock mode:', isMockMode());
      
      if (isMockMode()) {
        // Mock signin for testing
        console.log('Mock signin:', { email });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For mock mode, accept any email/password combination
        const mockUser = createMockUser(email, 'Test', 'User');
        
        return { user: mockUser, error: null };
      }

      console.log('Attempting Supabase signin...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase signin error:', error);
      } else {
        console.log('Signin successful:', data.user?.id);
      }

      return { user: data.user, error };
    } catch (error) {
      console.error('Signin exception:', error);
      return {
        user: null,
        error: {
          message: formatAuthError(error),
          name: 'AuthError',
          status: 0,
        } as AuthError,
      };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      if (isMockMode()) {
        // Mock signout for testing
        console.log('Mock signout');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        return { error: null };
      }

      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      if (isMockMode()) {
        // Mock get current user for testing
        console.log('Mock get current user');
        
        return { user: null, error: null };
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      return { user: null, error: error as AuthError };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      if (isMockMode()) {
        // Mock password reset for testing
        console.log('Mock password reset for:', email);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { error: null };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  },

  // Update password
  async updatePassword(password: string): Promise<{ error: AuthError | null }> {
    try {
      if (isMockMode()) {
        // Mock password update for testing
        console.log('Mock password update');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { error: null };
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    if (isMockMode()) {
      // Mock auth state change listener
      console.log('Mock auth state change listener set up');
      return {
        data: {
          subscription: {
            unsubscribe: () => console.log('Mock auth listener unsubscribed')
          }
        }
      };
    }

    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  },
}; 