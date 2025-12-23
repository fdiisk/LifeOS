-- Create cardio_entries table for individual cardio/steps logging
CREATE TABLE IF NOT EXISTS cardio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- For future multi-user support
  log_date DATE NOT NULL,
  entry_type TEXT NOT NULL, -- 'cardio', 'steps', 'run', 'bike', 'swim', 'walk', etc.

  -- Cardio metrics
  duration_minutes INTEGER,
  distance_km DECIMAL(6, 2),
  steps INTEGER,
  calories_burned INTEGER,
  avg_heart_rate INTEGER,

  -- Raw input and metadata
  raw_text TEXT,
  notes TEXT,
  ai_parsed_data JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_cardio_entries_log_date ON cardio_entries (log_date);
CREATE INDEX idx_cardio_entries_user_id ON cardio_entries (user_id);
CREATE INDEX idx_cardio_entries_entry_type ON cardio_entries (entry_type);

-- Add comments
COMMENT ON TABLE cardio_entries IS 'Individual cardio and steps entries';
COMMENT ON COLUMN cardio_entries.entry_type IS 'Type of cardio: cardio, steps, run, bike, swim, walk, etc.';
COMMENT ON COLUMN cardio_entries.duration_minutes IS 'Duration in minutes';
COMMENT ON COLUMN cardio_entries.distance_km IS 'Distance in kilometers';
COMMENT ON COLUMN cardio_entries.steps IS 'Step count';
COMMENT ON COLUMN cardio_entries.calories_burned IS 'Estimated calories burned';
COMMENT ON COLUMN cardio_entries.avg_heart_rate IS 'Average heart rate during activity';
COMMENT ON COLUMN cardio_entries.raw_text IS 'Original text input from user';

-- Enable RLS
ALTER TABLE cardio_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (single-user app)
CREATE POLICY cardio_entries_all_access ON cardio_entries
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_cardio_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cardio_entries_updated_at
BEFORE UPDATE ON cardio_entries
FOR EACH ROW
EXECUTE FUNCTION update_cardio_entries_updated_at();

-- Ensure gym_logs table exists (if not already created)
CREATE TABLE IF NOT EXISTS gym_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- For future multi-user support
  log_date DATE NOT NULL,
  workout_type TEXT,
  exercises JSONB, -- Array of exercise objects
  duration_minutes INTEGER,
  notes TEXT,
  raw_text TEXT, -- Raw input from user
  ai_parsed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add raw_text column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gym_logs' AND column_name = 'raw_text'
  ) THEN
    ALTER TABLE gym_logs ADD COLUMN raw_text TEXT;
  END IF;
END $$;

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_gym_logs_log_date ON gym_logs (log_date);
CREATE INDEX IF NOT EXISTS idx_gym_logs_user_id ON gym_logs (user_id);

-- Enable RLS if not already
ALTER TABLE gym_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS gym_logs_all_access ON gym_logs;
CREATE POLICY gym_logs_all_access ON gym_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at on gym_logs
CREATE OR REPLACE FUNCTION update_gym_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_gym_logs_updated_at ON gym_logs;
CREATE TRIGGER trigger_gym_logs_updated_at
BEFORE UPDATE ON gym_logs
FOR EACH ROW
EXECUTE FUNCTION update_gym_logs_updated_at();
