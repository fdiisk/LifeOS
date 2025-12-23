-- Create user_settings table for health metrics and preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- For multi-user support (future)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Health metrics
  height_cm DECIMAL(5, 1),
  current_weight_kg DECIMAL(5, 1),
  goal_weight_kg DECIMAL(5, 1),
  age INTEGER,

  -- Calorie targets
  goal_calories INTEGER,
  target_deficit_calories INTEGER,

  -- Macro profiles (stored as JSONB)
  macro_profiles JSONB DEFAULT '[]'::jsonb,
  active_macro_profile_id TEXT,

  -- Tracking preferences
  caffeine_tracking_enabled BOOLEAN DEFAULT true,

  CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- Add indexes
CREATE INDEX idx_user_settings_user_id ON user_settings (user_id);

-- Add comments
COMMENT ON TABLE user_settings IS 'User preferences and health metrics';
COMMENT ON COLUMN user_settings.height_cm IS 'Height in centimeters';
COMMENT ON COLUMN user_settings.current_weight_kg IS 'Current weight in kilograms';
COMMENT ON COLUMN user_settings.goal_weight_kg IS 'Target weight in kilograms';
COMMENT ON COLUMN user_settings.age IS 'Age in years';
COMMENT ON COLUMN user_settings.goal_calories IS 'Daily calorie goal';
COMMENT ON COLUMN user_settings.target_deficit_calories IS 'Target daily calorie deficit';
COMMENT ON COLUMN user_settings.macro_profiles IS 'Array of macro profiles with id, name, and percentages (protein, carbs, fat)';
COMMENT ON COLUMN user_settings.active_macro_profile_id IS 'ID of currently active macro profile';
COMMENT ON COLUMN user_settings.caffeine_tracking_enabled IS 'Whether to track caffeine intake';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_user_settings_updated_at();

-- Insert default settings row (for single-user app)
-- Macro profiles follow common patterns: balanced, cutting, bulking
INSERT INTO user_settings (user_id, macro_profiles, active_macro_profile_id, caffeine_tracking_enabled)
VALUES (
  NULL,
  '[
    {
      "id": "balanced",
      "name": "Balanced",
      "protein_percent": 30,
      "carbs_percent": 40,
      "fat_percent": 30
    },
    {
      "id": "cutting",
      "name": "Cutting (High Protein)",
      "protein_percent": 40,
      "carbs_percent": 30,
      "fat_percent": 30
    },
    {
      "id": "bulking",
      "name": "Bulking",
      "protein_percent": 25,
      "carbs_percent": 50,
      "fat_percent": 25
    }
  ]'::jsonb,
  'balanced',
  true
)
ON CONFLICT (user_id) DO NOTHING;

-- Add RLS policies (for future multi-user support)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (single-user app)
CREATE POLICY user_settings_all_access ON user_settings
FOR ALL
USING (true)
WITH CHECK (true);
