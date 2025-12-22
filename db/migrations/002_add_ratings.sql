-- Migration: Add daily ratings table
-- Description: Stores subjective daily ratings (focus, effort, mood)

CREATE TABLE IF NOT EXISTS daily_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  focus_rating INTEGER NOT NULL CHECK (focus_rating >= 0 AND focus_rating <= 100),
  effort_rating INTEGER NOT NULL CHECK (effort_rating >= 0 AND effort_rating <= 100),
  mood_rating INTEGER NOT NULL CHECK (mood_rating >= 0 AND mood_rating <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on date for efficient lookups
CREATE INDEX IF NOT EXISTS idx_daily_ratings_date ON daily_ratings(date);

-- Automatic updated_at trigger
CREATE TRIGGER update_daily_ratings_updated_at
  BEFORE UPDATE ON daily_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE daily_ratings IS 'Stores subjective daily ratings for focus, effort, and mood';
COMMENT ON COLUMN daily_ratings.focus_rating IS 'Subjective focus rating (0-100)';
COMMENT ON COLUMN daily_ratings.effort_rating IS 'Subjective effort rating (0-100)';
COMMENT ON COLUMN daily_ratings.mood_rating IS 'Subjective mood/wellbeing rating (0-100)';
