import { AuthError } from '@supabase/supabase-js';
import { ENV } from '../../config/env';

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message === 'failed to fetch' ||
    message.includes('network request failed') ||
    message.includes('network error') ||
    error.name === 'TypeError'
  );
}

export function formatAuthError(error: unknown): string {
  if (isNetworkError(error)) {
    const host = safeSupabaseHost();
    return host
      ? `Cannot reach Supabase at ${host}. Check EXPO_PUBLIC_SUPABASE_URL, your network, and that the Supabase project is active.`
      : 'Cannot reach Supabase. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.';
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const authError = error as AuthError;
    if (authError.message) {
      return authError.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Authentication failed. Please try again.';
}

function safeSupabaseHost(): string | null {
  try {
    return new URL(ENV.SUPABASE_URL).host;
  } catch {
    return null;
  }
}

export async function checkSupabaseReachable(): Promise<{ ok: boolean; detail?: string }> {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    return { ok: false, detail: 'Missing Supabase URL or anon key.' };
  }

  try {
    const response = await fetch(`${ENV.SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: ENV.SUPABASE_ANON_KEY,
      },
    });
    return response.ok
      ? { ok: true }
      : { ok: false, detail: `Supabase health check returned ${response.status}.` };
  } catch (error) {
    return { ok: false, detail: formatAuthError(error) };
  }
}
