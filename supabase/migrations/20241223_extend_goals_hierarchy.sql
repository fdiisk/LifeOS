-- Extend tasks table for time tracking and ratings
ALTER TABLE tasks
  ADD COLUMN time_spent_minutes INTEGER DEFAULT 0,
  ADD COLUMN focus_rating INTEGER CHECK (focus_rating >= 1 AND focus_rating <= 10),
  ADD COLUMN success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 10);

-- Add indexes for performance
CREATE INDEX idx_tasks_focus_rating ON tasks (focus_rating);
CREATE INDEX idx_tasks_success_rating ON tasks (success_rating);

-- Add comments
COMMENT ON COLUMN tasks.time_spent_minutes IS 'Time spent on this task in minutes';
COMMENT ON COLUMN tasks.focus_rating IS 'Focus level while working on task (1-10)';
COMMENT ON COLUMN tasks.success_rating IS 'Perceived success of task completion (1-10)';

-- Extend micro_goals table for aggregated metrics and binary completion
ALTER TABLE micro_goals
  ADD COLUMN is_completed BOOLEAN DEFAULT false,
  ADD COLUMN total_time_minutes INTEGER DEFAULT 0,
  ADD COLUMN avg_focus_rating DECIMAL(3, 1),
  ADD COLUMN avg_success_rating DECIMAL(3, 1),
  ADD COLUMN completed_at TIMESTAMPTZ;

-- Add indexes
CREATE INDEX idx_micro_goals_is_completed ON micro_goals (is_completed);
CREATE INDEX idx_micro_goals_completed_at ON micro_goals (completed_at);

-- Add comments
COMMENT ON COLUMN micro_goals.is_completed IS 'Binary completion status (true when all required tasks completed)';
COMMENT ON COLUMN micro_goals.total_time_minutes IS 'Aggregated time from child tasks';
COMMENT ON COLUMN micro_goals.avg_focus_rating IS 'Average focus rating from child tasks';
COMMENT ON COLUMN micro_goals.avg_success_rating IS 'Average success rating from child tasks';
COMMENT ON COLUMN micro_goals.completed_at IS 'Timestamp when goal was marked completed';

-- Add macro_goals aggregated fields (optional, for caching)
ALTER TABLE macro_goals
  ADD COLUMN total_medium_goals INTEGER DEFAULT 0,
  ADD COLUMN completed_medium_goals INTEGER DEFAULT 0,
  ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100);

-- Add indexes
CREATE INDEX idx_macro_goals_progress ON macro_goals (progress_percentage);

-- Add comments
COMMENT ON COLUMN macro_goals.total_medium_goals IS 'Total number of medium-term goals (micro_goals)';
COMMENT ON COLUMN macro_goals.completed_medium_goals IS 'Number of completed medium-term goals';
COMMENT ON COLUMN macro_goals.progress_percentage IS 'Progress based on completed medium goals (0-100)';

-- Function to update micro_goal aggregations from tasks
CREATE OR REPLACE FUNCTION update_micro_goal_aggregations()
RETURNS TRIGGER AS $$
BEGIN
  -- Update aggregations for the micro_goal
  UPDATE micro_goals
  SET
    total_time_minutes = COALESCE((
      SELECT SUM(time_spent_minutes)
      FROM tasks
      WHERE micro_goal_id = COALESCE(NEW.micro_goal_id, OLD.micro_goal_id)
        AND status != 'cancelled'
    ), 0),
    avg_focus_rating = (
      SELECT AVG(focus_rating)
      FROM tasks
      WHERE micro_goal_id = COALESCE(NEW.micro_goal_id, OLD.micro_goal_id)
        AND status != 'cancelled'
        AND focus_rating IS NOT NULL
    ),
    avg_success_rating = (
      SELECT AVG(success_rating)
      FROM tasks
      WHERE micro_goal_id = COALESCE(NEW.micro_goal_id, OLD.micro_goal_id)
        AND status != 'cancelled'
        AND success_rating IS NOT NULL
    )
  WHERE id = COALESCE(NEW.micro_goal_id, OLD.micro_goal_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update micro_goal aggregations when tasks change
CREATE TRIGGER trigger_update_micro_goal_aggregations
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW
WHEN (NEW.micro_goal_id IS NOT NULL OR OLD.micro_goal_id IS NOT NULL)
EXECUTE FUNCTION update_micro_goal_aggregations();

-- Function to update macro_goal progress from micro_goals
CREATE OR REPLACE FUNCTION update_macro_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update macro_goal counts and progress
  UPDATE macro_goals
  SET
    total_medium_goals = COALESCE((
      SELECT COUNT(*)
      FROM micro_goals
      WHERE macro_goal_id = COALESCE(NEW.macro_goal_id, OLD.macro_goal_id)
        AND status != 'abandoned'
    ), 0),
    completed_medium_goals = COALESCE((
      SELECT COUNT(*)
      FROM micro_goals
      WHERE macro_goal_id = COALESCE(NEW.macro_goal_id, OLD.macro_goal_id)
        AND is_completed = true
        AND status != 'abandoned'
    ), 0)
  WHERE id = COALESCE(NEW.macro_goal_id, OLD.macro_goal_id);

  -- Update progress percentage
  UPDATE macro_goals
  SET progress_percentage = CASE
    WHEN total_medium_goals = 0 THEN 0
    ELSE ROUND((completed_medium_goals::DECIMAL / total_medium_goals::DECIMAL) * 100)
  END
  WHERE id = COALESCE(NEW.macro_goal_id, OLD.macro_goal_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update macro_goal progress when micro_goals change
CREATE TRIGGER trigger_update_macro_goal_progress
AFTER INSERT OR UPDATE OR DELETE ON micro_goals
FOR EACH ROW
WHEN (NEW.macro_goal_id IS NOT NULL OR OLD.macro_goal_id IS NOT NULL)
EXECUTE FUNCTION update_macro_goal_progress();

-- Backfill existing data (set default values)
UPDATE tasks SET time_spent_minutes = 0 WHERE time_spent_minutes IS NULL;
UPDATE micro_goals SET is_completed = false WHERE is_completed IS NULL;
UPDATE micro_goals SET total_time_minutes = 0 WHERE total_time_minutes IS NULL;
UPDATE macro_goals SET total_medium_goals = 0 WHERE total_medium_goals IS NULL;
UPDATE macro_goals SET completed_medium_goals = 0 WHERE completed_medium_goals IS NULL;
UPDATE macro_goals SET progress_percentage = 0 WHERE progress_percentage IS NULL;

-- Manually trigger aggregation updates for existing data
DO $$
DECLARE
  micro_goal_record RECORD;
  macro_goal_record RECORD;
BEGIN
  -- Update micro_goal aggregations from tasks
  FOR micro_goal_record IN SELECT DISTINCT id FROM micro_goals LOOP
    UPDATE micro_goals
    SET
      total_time_minutes = COALESCE((
        SELECT SUM(time_spent_minutes)
        FROM tasks
        WHERE micro_goal_id = micro_goal_record.id
          AND status != 'cancelled'
      ), 0),
      avg_focus_rating = (
        SELECT AVG(focus_rating)
        FROM tasks
        WHERE micro_goal_id = micro_goal_record.id
          AND status != 'cancelled'
          AND focus_rating IS NOT NULL
      ),
      avg_success_rating = (
        SELECT AVG(success_rating)
        FROM tasks
        WHERE micro_goal_id = micro_goal_record.id
          AND status != 'cancelled'
          AND success_rating IS NOT NULL
      )
    WHERE id = micro_goal_record.id;
  END LOOP;

  -- Update macro_goal progress from micro_goals
  FOR macro_goal_record IN SELECT DISTINCT id FROM macro_goals LOOP
    UPDATE macro_goals
    SET
      total_medium_goals = COALESCE((
        SELECT COUNT(*)
        FROM micro_goals
        WHERE macro_goal_id = macro_goal_record.id
          AND status != 'abandoned'
      ), 0),
      completed_medium_goals = COALESCE((
        SELECT COUNT(*)
        FROM micro_goals
        WHERE macro_goal_id = macro_goal_record.id
          AND is_completed = true
          AND status != 'abandoned'
      ), 0)
    WHERE id = macro_goal_record.id;

    UPDATE macro_goals
    SET progress_percentage = CASE
      WHEN total_medium_goals = 0 THEN 0
      ELSE ROUND((completed_medium_goals::DECIMAL / total_medium_goals::DECIMAL) * 100)
    END
    WHERE id = macro_goal_record.id;
  END LOOP;
END $$;
