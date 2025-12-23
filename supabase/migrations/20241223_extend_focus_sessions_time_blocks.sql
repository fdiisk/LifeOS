-- Migration: Extend focus_sessions into time_blocks system
-- Adds support for daily time blocking with life area tracking and ratings

-- Add new columns to focus_sessions table
ALTER TABLE focus_sessions
  ADD COLUMN IF NOT EXISTS block_date DATE,
  ADD COLUMN IF NOT EXISTS life_area TEXT,
  ADD COLUMN IF NOT EXISTS macro_goal_id UUID REFERENCES macro_goals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS focus_rating INTEGER CHECK (focus_rating >= 1 AND focus_rating <= 10),
  ADD COLUMN IF NOT EXISTS success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 10);

-- Populate block_date from start_time for existing records
UPDATE focus_sessions
SET block_date = start_time::DATE
WHERE block_date IS NULL AND start_time IS NOT NULL;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_focus_sessions_block_date ON focus_sessions(block_date DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_life_area ON focus_sessions(life_area);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_macro_goal_id ON focus_sessions(macro_goal_id);

-- Add comment for documentation
COMMENT ON TABLE focus_sessions IS 'Focus sessions and time blocks with life area tracking, ratings, and optional task/goal linkage. Supports daily time blocking with 14-hour limit validation.';

COMMENT ON COLUMN focus_sessions.block_date IS 'Date of the time block (extracted from start_time for easier querying)';
COMMENT ON COLUMN focus_sessions.life_area IS 'Life area category: financial, personal, relationships, recreation, career, hobbies, health';
COMMENT ON COLUMN focus_sessions.macro_goal_id IS 'Optional link to macro goal this block contributes to';
COMMENT ON COLUMN focus_sessions.focus_rating IS 'Focus quality rating from 1 (distracted) to 10 (deep focus)';
COMMENT ON COLUMN focus_sessions.success_rating IS 'Success/completion rating from 1 (failed) to 10 (exceeded goals)';
