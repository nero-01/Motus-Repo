import { authService } from '../../../../services/supabase/auth';
import { checkSupabaseReachable, formatAuthError } from '../../../../services/supabase/authErrors';
import { mapSupabaseUser } from '../../../../services/supabase/mapUser';
import { ENV } from '../../../../config/env';
import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('[Auth] Login attempt', {
        email: credentials.email,
        mockMode: ENV.FORCE_MOCK,
        supabaseHost: safeHost(),
      });

      const { user, error } = await authService.signIn(credentials.email, credentials.password);

      if (error) {
        console.error('[Auth] Supabase sign-in error:', error);
        throw error;
      }

      if (!user) {
        throw new Error('No user returned from sign-in.');
      }

      let token = 'mock-session';
      if (!ENV.FORCE_MOCK) {
        const { supabase } = await import('../../../../services/supabase/client');
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token ?? '';
      }

      return {
        user: mapSupabaseUser(user),
        token,
      };
    } catch (error) {
      if (!ENV.FORCE_MOCK) {
        const reachability = await checkSupabaseReachable();
        if (!reachability.ok) {
          console.error('[Auth] Supabase unreachable:', reachability.detail);
        }
      }
      console.error('[Auth] Login failed:', error);
      throw new Error(formatAuthError(error));
    }
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const [firstName, ...rest] = credentials.name.trim().split(/\s+/);
      const lastName = rest.join(' ');

      const { user, error } = await authService.signUp(
        credentials.email,
        credentials.password,
        firstName || credentials.name,
        lastName || ''
      );

      if (error) {
        throw error;
      }

      if (!user) {
        throw new Error('No user returned from sign-up.');
      }

      let token = 'mock-session';
      if (!ENV.FORCE_MOCK) {
        const { supabase } = await import('../../../../services/supabase/client');
        const { data: sessionData } = await supabase.auth.getSession();
        token = sessionData.session?.access_token ?? '';
      }

      return {
        user: mapSupabaseUser(user),
        token,
      };
    } catch (error) {
      if (!ENV.FORCE_MOCK) {
        const reachability = await checkSupabaseReachable();
        if (!reachability.ok) {
          console.error('[Auth] Supabase unreachable:', reachability.detail);
        }
      }
      throw new Error(formatAuthError(error));
    }
  }

  static async logout(): Promise<void> {
    try {
      const { error } = await authService.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(formatAuthError(error));
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const { user, error } = await authService.getCurrentUser();

      if (error || !user) {
        return null;
      }

      return mapSupabaseUser(user);
    } catch (error) {
      console.error('[Auth] Error getting current user:', error);
      return null;
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await authService.resetPassword(email);
      if (error) {
        throw error;
      }
    } catch (error) {
      throw new Error(formatAuthError(error));
    }
  }

  static async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const { supabase } = await import('../../../../services/supabase/client');
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: updates.name,
          avatar_url: updates.avatar,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('No user returned from profile update.');
      }

      return mapSupabaseUser(data.user);
    } catch (error) {
      throw new Error(formatAuthError(error));
    }
  }
}

function safeHost(): string | null {
  try {
    return new URL(ENV.SUPABASE_URL).host;
  } catch {
    return null;
  }
}
