-- Fix worksheet_progress table by adding unique constraint
-- This fixes the "ON CONFLICT" error in the education service
-- Idempotent: safe to re-run (skips if constraint already exists)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'worksheet_progress'
      AND c.conname = 'worksheet_progress_worksheet_child_unique'
  ) THEN
    ALTER TABLE worksheet_progress
    ADD CONSTRAINT worksheet_progress_worksheet_child_unique
    UNIQUE (worksheet_id, child_id);
  END IF;
END $$;

-- Optional supporting index (no-op if an equivalent index already exists from the UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_worksheet_progress_worksheet_child
ON worksheet_progress (worksheet_id, child_id);
