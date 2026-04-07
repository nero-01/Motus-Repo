import { supabase } from '../../../../services/supabase/client';
import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      const user: User = {
        id: data.user!.id,
        email: data.user!.email!,
        name: data.user!.user_metadata?.name,
        avatar: data.user!.user_metadata?.avatar_url,
        createdAt: data.user!.created_at,
        updatedAt: data.user!.updated_at!,
      };

      return {
        user,
        token: data.session!.access_token,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
          },
        },
      });

      if (error) throw error;

      const user: User = {
        id: data.user!.id,
        email: data.user!.email!,
        name: credentials.name,
        createdAt: data.user!.created_at,
        updatedAt: data.user!.updated_at!,
      };

      return {
        user,
        token: data.session!.access_token,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  static async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Logout failed');
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) return null;

      return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name,
        avatar: user.user_metadata?.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at!,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Password reset failed');
    }
  }

  static async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: updates.name,
          avatar_url: updates.avatar,
        },
      });

      if (error) throw error;

      return {
        id: data.user!.id,
        email: data.user!.email!,
        name: data.user!.user_metadata?.name,
        avatar: data.user!.user_metadata?.avatar_url,
        createdAt: data.user!.created_at,
        updatedAt: data.user!.updated_at!,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Profile update failed');
    }
  }

  /** Requires an active session. Does not verify the old password (Supabase handles policy server-side). */
  static async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Password update failed');
    }
  }
}
