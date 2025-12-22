-- Life OS Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- GOAL MANAGEMENT TABLES
-- ============================================================================

-- Macro Goals (Top-level goals)
CREATE TABLE macro_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'abandoned')),
  target_date DATE,
  ai_parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_macro_goals_status ON macro_goals(status);
CREATE INDEX idx_macro_goals_created_at ON macro_goals(created_at DESC);

-- Micro Goals (Child of macro goals)
CREATE TABLE micro_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  macro_goal_id UUID REFERENCES macro_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'abandoned')),
  target_date DATE,
  ai_parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_micro_goals_macro_goal_id ON micro_goals(macro_goal_id);
CREATE INDEX idx_micro_goals_status ON micro_goals(status);
CREATE INDEX idx_micro_goals_created_at ON micro_goals(created_at DESC);

-- Tasks (Child of micro goals)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  micro_goal_id UUID REFERENCES micro_goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  ai_parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_micro_goal_id ON tasks(micro_goal_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- ============================================================================
-- HABIT TRACKING
-- ============================================================================

-- Habits
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  target_count INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ai_parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_habits_is_active ON habits(is_active);
CREATE INDEX idx_habits_created_at ON habits(created_at DESC);

-- ============================================================================
-- DAILY LOGGING
-- ============================================================================

-- Daily Logs (Related to tasks and habits)
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_date DATE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  notes TEXT,
  mood TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  ai_parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_task_or_habit CHECK (task_id IS NOT NULL OR habit_id IS NOT NULL OR notes IS NOT NULL)
);

CREATE INDEX idx_daily_logs_log_date ON daily_logs(log_date DESC);
CREATE INDEX idx_daily_logs_task_id ON daily_logs(task_id);
CREATE INDEX idx_daily_logs_habit_id ON daily_logs(habit_id);
CREATE INDEX idx_daily_logs_created_at ON daily_logs(created_at DESC);

-- ============================================================================
-- HEALTH & FITNESS
-- ============================================================================

-- Nutrition Logs
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_items JSONB NOT NULL,
  total_calories INTEGER,
  protein_grams DECIMAL(6, 2),
  carbs_grams DECIMAL(6, 2),
  fats_grams DECIMAL(6, 2),
  notes TEXT,
  ai_parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nutrition_logs_log_date ON nutrition_logs(log_date DESC);
CREATE INDEX idx_nutrition_logs_meal_type ON nutrition_logs(meal_type);
CREATE INDEX idx_nutrition_logs_created_at ON nutrition_logs(created_at DESC);

-- Gym Logs
CREATE TABLE gym_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_date DATE NOT NULL,
  workout_type TEXT NOT NULL,
  exercises JSONB NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  ai_parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gym_logs_log_date ON gym_logs(log_date DESC);
CREATE INDEX idx_gym_logs_workout_type ON gym_logs(workout_type);
CREATE INDEX idx_gym_logs_created_at ON gym_logs(created_at DESC);

-- Body Metrics
CREATE TABLE body_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_date DATE NOT NULL,
  weight_kg DECIMAL(5, 2),
  body_fat_percentage DECIMAL(4, 2),
  muscle_mass_kg DECIMAL(5, 2),
  measurements JSONB,
  notes TEXT,
  ai_parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_body_metrics_log_date ON body_metrics(log_date DESC);
CREATE INDEX idx_body_metrics_created_at ON body_metrics(created_at DESC);

-- ============================================================================
-- PRODUCTIVITY
-- ============================================================================

-- Focus Sessions
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  was_successful BOOLEAN,
  ai_parsed_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_focus_sessions_start_time ON focus_sessions(start_time DESC);
CREATE INDEX idx_focus_sessions_task_id ON focus_sessions(task_id);
CREATE INDEX idx_focus_sessions_created_at ON focus_sessions(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_macro_goals_updated_at BEFORE UPDATE ON macro_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_micro_goals_updated_at BEFORE UPDATE ON micro_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nutrition_logs_updated_at BEFORE UPDATE ON nutrition_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gym_logs_updated_at BEFORE UPDATE ON gym_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_body_metrics_updated_at BEFORE UPDATE ON body_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_focus_sessions_updated_at BEFORE UPDATE ON focus_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Ready for future implementation
-- ============================================================================

-- Enable RLS on all tables (uncomment when ready to implement auth)
-- ALTER TABLE macro_goals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE micro_goals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gym_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
