-- MotusTots: Push token storage for server-side push notifications
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS push_tokens (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token        TEXT NOT NULL,
  platform     TEXT NOT NULL CHECK (platform IN ('expo', 'web')),
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON push_tokens(user_id);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push tokens" ON push_tokens;
CREATE POLICY "Users manage own push tokens"
  ON push_tokens
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role reads all tokens" ON push_tokens;
CREATE POLICY "Service role reads all tokens"
  ON push_tokens
  FOR SELECT
  USING (auth.role() = 'service_role');
