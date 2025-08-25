import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../../../services/supabase/client';
import { SocialLoginProvider } from '../types';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

export class SocialAuthService {
  private static readonly GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  private static readonly FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
  private static readonly APPLE_CLIENT_ID = process.env.EXPO_PUBLIC_APPLE_CLIENT_ID;

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
    {
      id: 'apple',
      name: 'Apple',
      icon: '🍎',
      color: '#000000',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
    },
  ];

  static async signInWithGoogle(): Promise<void> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'motustots',
        path: 'auth/callback',
      });

      const request = new AuthSession.AuthRequest({
        clientId: this.GOOGLE_CLIENT_ID!,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {
          access_type: 'offline',
        },
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
      });

      if (result.type === 'success' && result.params.code) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: result.params.code,
        });

        if (error) throw error;
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Google sign-in failed');
    }
  }

  static async signInWithFacebook(): Promise<void> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'motustots',
        path: 'auth/callback',
      });

      const request = new AuthSession.AuthRequest({
        clientId: this.FACEBOOK_APP_ID!,
        scopes: ['public_profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
      });

      if (result.type === 'success' && result.params.code) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'facebook',
          token: result.params.code,
        });

        if (error) throw error;
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Facebook sign-in failed');
    }
  }

  static async signInWithApple(): Promise<void> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'motustots',
        path: 'auth/callback',
      });

      const request = new AuthSession.AuthRequest({
        clientId: this.APPLE_CLIENT_ID!,
        scopes: ['name', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
      });

      if (result.type === 'success' && result.params.code) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: result.params.code,
        });

        if (error) throw error;
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Apple sign-in failed');
    }
  }

  static async signInWithTwitter(): Promise<void> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'motustots',
        path: 'auth/callback',
      });

      // Note: Twitter OAuth 2.0 requires additional setup
      // This is a placeholder implementation
      throw new Error('Twitter sign-in not yet implemented');
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Twitter sign-in failed');
    }
  }

  static async signInWithProvider(providerId: SocialLoginProvider['id']): Promise<void> {
    switch (providerId) {
      case 'google':
        return this.signInWithGoogle();
      case 'facebook':
        return this.signInWithFacebook();
      case 'apple':
        return this.signInWithApple();
      case 'twitter':
        return this.signInWithTwitter();
      default:
        throw new Error(`Unsupported provider: ${providerId}`);
    }
  }
}
