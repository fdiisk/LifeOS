-- Migration: Add morning reflection fields to daily_logs
-- Supports comprehensive morning flow with yesterday's review and planning

-- Add new columns for morning reflection
ALTER TABLE daily_logs
  ADD COLUMN IF NOT EXISTS morning_reflection TEXT,
  ADD COLUMN IF NOT EXISTS evening_journal TEXT,
  ADD COLUMN IF NOT EXISTS what_went_well TEXT[],
  ADD COLUMN IF NOT EXISTS even_better_if TEXT[],
  ADD COLUMN IF NOT EXISTS day_rating INTEGER CHECK (day_rating >= 1 AND day_rating <= 10),
  ADD COLUMN IF NOT EXISTS gratitude TEXT,
  ADD COLUMN IF NOT EXISTS sleep_start_time TIME,
  ADD COLUMN IF NOT EXISTS sleep_wake_time TIME,
  ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(4, 2);

-- Remove the constraint that requires task_id or habit_id
-- This allows daily_logs to exist for daily reflections without specific tasks/habits
ALTER TABLE daily_logs
  DROP CONSTRAINT IF EXISTS check_task_or_habit;

-- Add unique constraint for log_date to ensure one daily record per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_logs_unique_date ON daily_logs(log_date) WHERE task_id IS NULL AND habit_id IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN daily_logs.what_went_well IS 'Array of 3 things that went well yesterday';
COMMENT ON COLUMN daily_logs.even_better_if IS 'Array of 3 improvements for tomorrow';
COMMENT ON COLUMN daily_logs.day_rating IS 'Overall day rating from 1-10';
COMMENT ON COLUMN daily_logs.gratitude IS 'One thing to be grateful for';
COMMENT ON COLUMN daily_logs.sleep_start_time IS 'Time went to bed last night';
COMMENT ON COLUMN daily_logs.sleep_wake_time IS 'Time woke up this morning';
COMMENT ON COLUMN daily_logs.sleep_hours IS 'Calculated sleep duration in hours';
