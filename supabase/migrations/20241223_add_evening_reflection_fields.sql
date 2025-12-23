-- Add evening reflection and day locking fields to daily_logs
ALTER TABLE daily_logs
  ADD COLUMN evening_focus_rating INTEGER CHECK (evening_focus_rating >= 1 AND evening_focus_rating <= 10),
  ADD COLUMN evening_effort_rating INTEGER CHECK (evening_effort_rating >= 1 AND evening_effort_rating <= 10),
  ADD COLUMN evening_mood_rating INTEGER CHECK (evening_mood_rating >= 1 AND evening_mood_rating <= 10),
  ADD COLUMN evening_success_rating INTEGER CHECK (evening_success_rating >= 1 AND evening_success_rating <= 10),
  ADD COLUMN evening_journal TEXT,
  ADD COLUMN day_locked BOOLEAN DEFAULT false,
  ADD COLUMN locked_at TIMESTAMPTZ;

-- Add index for locked days
CREATE INDEX idx_daily_logs_day_locked ON daily_logs (day_locked);

-- Add index for locked_at timestamp
CREATE INDEX idx_daily_logs_locked_at ON daily_logs (locked_at);

-- Comment on columns
COMMENT ON COLUMN daily_logs.evening_focus_rating IS 'Evening rating for focus level (1-10)';
COMMENT ON COLUMN daily_logs.evening_effort_rating IS 'Evening rating for effort level (1-10)';
COMMENT ON COLUMN daily_logs.evening_mood_rating IS 'Evening rating for mood (1-10)';
COMMENT ON COLUMN daily_logs.evening_success_rating IS 'Evening rating for perceived success (1-10)';
COMMENT ON COLUMN daily_logs.evening_journal IS 'Evening journal entry (minimum 5 lines required)';
COMMENT ON COLUMN daily_logs.day_locked IS 'Whether the day has been locked (entries become read-only)';
COMMENT ON COLUMN daily_logs.locked_at IS 'Timestamp when the day was locked';
