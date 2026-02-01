import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { authService } from '../services/supabase/auth';
import { useFamilyStore } from './familyStore';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { user, error } = await authService.signIn(email, password);
      
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ 
        user, 
        isAuthenticated: !!user, 
        isLoading: false,
        error: null 
      });

      // Load family data if user is authenticated
      if (user) {
        try {
          const familyStore = useFamilyStore.getState();
          await familyStore.loadFamilies(user.id);
        } catch (error) {
          console.error('Error loading families after sign in:', error);
        }
      }
    } catch (error) {
      console.error('Sign in error:', error);
      set({ 
        error: 'An unexpected error occurred', 
        isLoading: false 
      });
    }
  },

  signUp: async (email: string, password: string, firstName: string, lastName: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { user, error } = await authService.signUp(email, password, firstName, lastName);
      
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ 
        user, 
        isAuthenticated: !!user, 
        isLoading: false,
        error: null 
      });

      // Load family data if user is authenticated
      if (user) {
        try {
          const familyStore = useFamilyStore.getState();
          await familyStore.loadFamilies(user.id);
        } catch (error) {
          console.error('Error loading families after sign up:', error);
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      set({ 
        error: 'An unexpected error occurred', 
        isLoading: false 
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    
    try {
      const { error } = await authService.signOut();
      
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null
      });

      // Reset family store
      try {
        const familyStore = useFamilyStore.getState();
        familyStore.reset();
      } catch (error) {
        console.error('Error resetting family store:', error);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      set({ 
        error: 'An unexpected error occurred', 
        isLoading: false 
      });
    }
  },

  setUser: (user: User | null) => {
    if (__DEV__) console.log('Setting user:', user?.id || 'null');
    set({ 
      user, 
      isAuthenticated: !!user,
      isLoading: false 
    });

    // Load family data if user is authenticated
    if (user) {
      try {
        const familyStore = useFamilyStore.getState();
        familyStore.loadFamilies(user.id).catch(error => {
          if (__DEV__) console.warn('Error loading families after setUser:', error);
        });
      } catch (error) {
        if (__DEV__) console.warn('Error accessing family store in setUser:', error);
      }
    }
  },

  clearError: () => {
    set({ error: null });
  },

  checkAuth: async () => {
    if (__DEV__) console.log('Checking auth...');
    set({ isLoading: true });

    try {
      const { user, error } = await authService.getCurrentUser();
      if (error && __DEV__) console.warn('Auth check error:', error);
      if (__DEV__) console.log('Auth check result:', { user: user?.id || 'null', error: error?.message });
      set({ 
        user, 
        isAuthenticated: !!user, 
        isLoading: false 
      });

      // Load family data if user is authenticated
      if (user) {
        try {
          const familyStore = useFamilyStore.getState();
          await familyStore.loadFamilies(user.id).catch(error => {
            console.error('Error loading families after auth check:', error);
          });
        } catch (error) {
          console.error('Error accessing family store in checkAuth:', error);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },
})); 