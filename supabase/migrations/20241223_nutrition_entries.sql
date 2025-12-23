-- Create nutrition_entries table for individual food items
-- This replaces the monolithic nutrition_logs approach with granular entry-level tracking

CREATE TABLE IF NOT EXISTS nutrition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entry metadata
  log_date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  entry_type TEXT CHECK (entry_type IN ('food', 'water', 'caffeine')) DEFAULT 'food',

  -- Food item details
  name TEXT NOT NULL,
  brand TEXT,
  serving_size TEXT,

  -- Nutritional information
  calories NUMERIC(8, 2) DEFAULT 0,
  protein_g NUMERIC(8, 2) DEFAULT 0,
  carbs_g NUMERIC(8, 2) DEFAULT 0,
  fat_g NUMERIC(8, 2) DEFAULT 0,

  -- AI parsing metadata
  raw_text TEXT,
  ai_parsed_data JSONB,
  final_confirmed_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT nutrition_entries_name_check CHECK (char_length(name) > 0)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_user_id ON nutrition_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_log_date ON nutrition_entries(log_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_meal_type ON nutrition_entries(meal_type);
CREATE INDEX IF NOT EXISTS idx_nutrition_entries_user_date ON nutrition_entries(user_id, log_date);

-- Enable Row Level Security
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own nutrition entries"
  ON nutrition_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition entries"
  ON nutrition_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition entries"
  ON nutrition_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition entries"
  ON nutrition_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nutrition_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER nutrition_entries_updated_at
  BEFORE UPDATE ON nutrition_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_entries_updated_at();

-- Add comment for documentation
COMMENT ON TABLE nutrition_entries IS 'Individual nutrition entries with AI parsing metadata and user confirmations';
