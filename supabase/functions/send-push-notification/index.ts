/**
 * Supabase Edge Function: send-push-notification
 *
 * Called by your server or a scheduled job to send push notifications.
 * Supports both Expo push tokens and Web Push (VAPID).
 *
 * Deploy: supabase functions deploy send-push-notification
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload: PushPayload = await req.json();

    let query = supabase.from('push_tokens').select('token, platform, user_id');
    if (payload.userId) {
      query = query.eq('user_id', payload.userId);
    }
    const { data: tokens, error } = await query;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const expoTokens = (tokens ?? [])
      .filter((t) => t.platform === 'expo')
      .map((t) => t.token);

    const results: unknown[] = [];

    if (expoTokens.length) {
      const messages = expoTokens.map((to) => ({
        to,
        title: payload.title,
        body: payload.body,
        sound: 'default',
        data: payload.data ?? {},
      }));

      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      results.push({ expo: await res.json() });
    }

    return new Response(JSON.stringify({ ok: true, sent: results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
