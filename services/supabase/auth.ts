import { supabase } from './client';
import { AuthError, User } from '@supabase/supabase-js';
import { ENV } from '../../config/env';

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
  if (__DEV__) {
    console.log('Mock mode check:', {
      forceMock: ENV.FORCE_MOCK,
      supabaseUrl: ENV.SUPABASE_URL ? 'set' : 'missing',
      isDefaultUrl: ENV.SUPABASE_URL === 'https://your-project.supabase.co'
    });
  }
  return ENV.FORCE_MOCK || !ENV.SUPABASE_URL || ENV.SUPABASE_URL === 'https://your-project.supabase.co';
};

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, firstName: string, lastName: string): Promise<AuthResponse> {
    try {
      if (__DEV__) console.log('Starting signup process...');
      if (__DEV__) console.log('Mock mode:', isMockMode());

      if (isMockMode()) {
        if (__DEV__) console.log('Mock signup:', { email, firstName: '***', lastName: '***' });
        const mockUser = createMockUser(email, firstName, lastName);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return { user: mockUser, error: null };
      }

      if (__DEV__) console.log('Attempting Supabase signup...');
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
        if (__DEV__) console.warn('Supabase signup error:', error);
        return { user: null, error };
      }

      if (__DEV__) console.log('User signed up successfully');
      return { user: data.user, error: null };
    } catch (error) {
      if (__DEV__) console.warn('Signup exception:', error);
      return { user: null, error: error as AuthError };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      if (__DEV__) console.log('Starting signin process...');
      if (__DEV__) console.log('Mock mode:', isMockMode());

      if (isMockMode()) {
        if (__DEV__) console.log('Mock signin');
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For mock mode, accept any email/password combination
        const mockUser = createMockUser(email, 'Test', 'User');
        
        return { user: mockUser, error: null };
      }

      if (__DEV__) console.log('Attempting Supabase signin...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error && __DEV__) console.warn('Supabase signin error:', error);
      if (!error && __DEV__) console.log('Signin successful');
      return { user: data.user, error };
    } catch (error) {
      if (__DEV__) console.warn('Signin exception:', error);
      return { user: null, error: error as AuthError };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      if (isMockMode()) {
        if (__DEV__) console.log('Mock signout');
        
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
        if (__DEV__) console.log('Mock get current user');
        
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
        if (__DEV__) console.log('Mock password reset for:', email);
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
        if (__DEV__) console.log('Mock password update');
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
      if (__DEV__) console.log('Mock auth state change listener set up');
      return {
        data: {
          subscription: {
            unsubscribe: () => { if (__DEV__) console.log('Mock auth listener unsubscribed'); }
          }
        }
      };
    }

    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
  },
}; 