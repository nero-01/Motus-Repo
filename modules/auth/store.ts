import { create } from 'zustand'
import { AuthState, LoginCredentials, RegisterCredentials } from './types'
import { supabase } from '@/components/providers'

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  setUser: (user: AuthState['user']) => void
  setSession: (session: AuthState['session']) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  login: async (credentials) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials)
      if (error) throw error
      
      set({ 
        user: data.user,
        session: data.session,
        loading: false 
      })
    } catch (error: any) {
      set({ 
        error: error.message, 
        loading: false 
      })
    }
  },

  register: async (credentials) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
          }
        }
      })
      if (error) throw error
      
      set({ 
        user: data.user,
        session: data.session,
        loading: false 
      })
    } catch (error: any) {
      set({ 
        error: error.message, 
        loading: false 
      })
    }
  },

  logout: async () => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      set({ 
        user: null,
        session: null,
        loading: false 
      })
    } catch (error: any) {
      set({ 
        error: error.message, 
        loading: false 
      })
    }
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      
      set({ loading: false })
    } catch (error: any) {
      set({ 
        error: error.message, 
        loading: false 
      })
    }
  },
}))
