-- Fix worksheet_progress table by adding unique constraint
-- This fixes the "ON CONFLICT" error in the education service

-- Add unique constraint to worksheet_progress table
ALTER TABLE worksheet_progress 
ADD CONSTRAINT worksheet_progress_worksheet_child_unique 
UNIQUE (worksheet_id, child_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_worksheet_progress_worksheet_child 
ON worksheet_progress (worksheet_id, child_id); 