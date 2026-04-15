import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../../../services/supabase/client';
import { SocialLoginProvider } from '../types';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

export class SocialAuthService {
  static readonly socialProviders: SocialLoginProvider[] = [
    {
      id: 'google',
      name: 'Google',
      icon: '🔍',
      color: '#4285F4',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: '📘',
      color: '#1877F2',
    },
  ];

  private static extractCodeFromRedirect(url: string): string | null {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get('code');
    } catch {
      const queryString = url.split('?')[1] ?? '';
      const params = new URLSearchParams(queryString);
      return params.get('code');
    }
  }

  private static async signInWithSupabaseOAuth(
    provider: 'google' | 'facebook'
  ): Promise<void> {
    const redirectTo = Linking.createURL('auth/callback');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }
    if (!data?.url) {
      throw new Error(`Could not start ${provider} sign-in flow.`);
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !result.url) {
      throw new Error('Social sign-in was cancelled.');
    }
    const code = this.extractCodeFromRedirect(result.url);
    if (!code) {
      throw new Error('Missing auth code from redirect URL.');
    }
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      throw exchangeError;
    }
  }

  static async signInWithGoogle(): Promise<void> {
    try {
      await this.signInWithSupabaseOAuth('google');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Google sign-in failed');
    }
  }

  static async signInWithFacebook(): Promise<void> {
    try {
      await this.signInWithSupabaseOAuth('facebook');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Facebook sign-in failed');
    }
  }
  static async signInWithProvider(providerId: SocialLoginProvider['id']): Promise<void> {
    switch (providerId) {
      case 'google':
        return this.signInWithGoogle();
      case 'facebook':
        return this.signInWithFacebook();
      default:
        throw new Error(`Unsupported provider: ${providerId}`);
    }
  }
}
