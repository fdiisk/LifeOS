-- Life OS Database Seed Data
-- Sample data for testing and development

-- ============================================================================
-- MACRO GOALS
-- ============================================================================

INSERT INTO macro_goals (id, title, description, status, target_date) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Get Healthy & Fit', 'Achieve optimal health through consistent exercise and nutrition', 'active', '2026-12-31'),
  ('a2222222-2222-2222-2222-222222222222', 'Build Successful Career', 'Advance in tech career and develop new skills', 'active', '2027-06-30'),
  ('a3333333-3333-3333-3333-333333333333', 'Master Personal Finance', 'Build wealth and achieve financial independence', 'active', '2030-12-31');

-- ============================================================================
-- MICRO GOALS
-- ============================================================================

INSERT INTO micro_goals (id, macro_goal_id, title, description, status, target_date) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Lose 20 pounds', 'Reach target weight of 180 lbs', 'active', '2026-06-30'),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Run a marathon', 'Complete a full marathon under 4 hours', 'active', '2026-10-31'),
  ('b3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'Learn React & Next.js', 'Master modern web development stack', 'active', '2026-03-31'),
  ('b4444444-4444-4444-4444-444444444444', 'a2222222-2222-2222-2222-222222222222', 'Get promoted to Senior Developer', 'Demonstrate leadership and technical excellence', 'active', '2026-12-31'),
  ('b5555555-5555-5555-5555-555555555555', 'a3333333-3333-3333-3333-333333333333', 'Save $50,000 emergency fund', 'Build financial safety net', 'active', '2027-12-31');

-- ============================================================================
-- TASKS
-- ============================================================================

INSERT INTO tasks (id, micro_goal_id, title, description, status, priority, due_date) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Track calories daily', 'Use app to log all meals and stay under calorie goal', 'in_progress', 'high', '2025-12-31'),
  ('c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Meal prep for the week', 'Prepare healthy meals for Monday-Friday', 'pending', 'medium', '2025-12-22'),
  ('c3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'Complete 5K training run', 'Run 5K at comfortable pace', 'pending', 'high', '2025-12-23'),
  ('c4444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333', 'Complete Next.js tutorial', 'Finish official Next.js documentation tutorial', 'completed', 'high', '2025-12-20'),
  ('c5555555-5555-5555-5555-555555555555', 'b3333333-3333-3333-3333-333333333333', 'Build a personal project', 'Create a full-stack app with Next.js and Supabase', 'in_progress', 'high', '2026-01-15'),
  ('c6666666-6666-6666-6666-666666666666', NULL, 'Review quarterly budget', 'Analyze spending and adjust budget categories', 'pending', 'medium', '2025-12-28');

-- ============================================================================
-- HABITS
-- ============================================================================

INSERT INTO habits (id, name, description, frequency, target_count, is_active) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Morning Workout', 'Exercise for at least 30 minutes', 'daily', 1, true),
  ('d2222222-2222-2222-2222-222222222222', 'Read for 20 minutes', 'Read books or technical articles', 'daily', 1, true),
  ('d3333333-3333-3333-3333-333333333333', 'Drink 8 glasses of water', 'Stay hydrated throughout the day', 'daily', 8, true),
  ('d4444444-4444-4444-4444-444444444444', 'Meditation', 'Practice mindfulness meditation', 'daily', 1, true),
  ('d5555555-5555-5555-5555-555555555555', 'Weekly meal prep', 'Prepare meals for the week ahead', 'weekly', 1, true);

-- ============================================================================
-- DAILY LOGS
-- ============================================================================

INSERT INTO daily_logs (log_date, task_id, habit_id, notes, mood, energy_level) VALUES
  ('2025-12-21', 'c1111111-1111-1111-1111-111111111111', NULL, 'Logged all meals, stayed under calorie goal', 'good', 8),
  ('2025-12-21', NULL, 'd1111111-1111-1111-1111-111111111111', 'Great 45-minute run this morning', 'excellent', 9),
  ('2025-12-21', NULL, 'd2222222-2222-2222-2222-222222222222', 'Read chapter 3 of Clean Code', 'good', 7),
  ('2025-12-21', NULL, 'd3333333-3333-3333-3333-333333333333', 'Drank all 8 glasses', 'good', 8),
  ('2025-12-20', 'c1111111-1111-1111-1111-111111111111', NULL, 'Tracked calories, went over by 200 cals', 'neutral', 6),
  ('2025-12-20', NULL, 'd1111111-1111-1111-1111-111111111111', 'Skipped morning workout, too tired', 'tired', 4);

-- ============================================================================
-- NUTRITION LOGS
-- ============================================================================

INSERT INTO nutrition_logs (log_date, meal_type, food_items, total_calories, protein_grams, carbs_grams, fats_grams) VALUES
  ('2025-12-21', 'breakfast', '{"items": [{"name": "Oatmeal with berries", "calories": 300}, {"name": "Coffee", "calories": 5}]}', 305, 10, 55, 5),
  ('2025-12-21', 'lunch', '{"items": [{"name": "Grilled chicken salad", "calories": 450}, {"name": "Apple", "calories": 95}]}', 545, 45, 35, 15),
  ('2025-12-21', 'dinner', '{"items": [{"name": "Salmon with vegetables", "calories": 520}, {"name": "Brown rice", "calories": 215}]}', 735, 48, 52, 28),
  ('2025-12-20', 'breakfast', '{"items": [{"name": "Greek yogurt with granola", "calories": 280}]}', 280, 18, 38, 8),
  ('2025-12-20', 'lunch', '{"items": [{"name": "Turkey sandwich", "calories": 420}, {"name": "Chips", "calories": 150}]}', 570, 28, 62, 18);

-- ============================================================================
-- GYM LOGS
-- ============================================================================

INSERT INTO gym_logs (log_date, workout_type, exercises, duration_minutes) VALUES
  ('2025-12-21', 'Cardio', '{"exercises": [{"name": "Running", "duration_min": 45, "distance_km": 6.5, "pace": "6:55/km"}]}', 45),
  ('2025-12-20', 'Strength Training', '{"exercises": [{"name": "Bench Press", "sets": 3, "reps": 10, "weight_lbs": 185}, {"name": "Squats", "sets": 3, "reps": 12, "weight_lbs": 225}, {"name": "Deadlifts", "sets": 3, "reps": 8, "weight_lbs": 275}]}', 60),
  ('2025-12-19', 'Cardio', '{"exercises": [{"name": "Cycling", "duration_min": 30, "distance_km": 15, "avg_speed": "30 km/h"}]}', 30);

-- ============================================================================
-- BODY METRICS
-- ============================================================================

INSERT INTO body_metrics (log_date, weight_kg, body_fat_percentage, muscle_mass_kg, measurements) VALUES
  ('2025-12-21', 88.5, 18.5, 68.2, '{"chest_cm": 102, "waist_cm": 85, "hips_cm": 98, "thigh_cm": 58}'),
  ('2025-12-14', 89.2, 19.0, 67.8, '{"chest_cm": 102, "waist_cm": 86, "hips_cm": 99, "thigh_cm": 58}'),
  ('2025-12-07', 90.0, 19.5, 67.5, '{"chest_cm": 102, "waist_cm": 87, "hips_cm": 100, "thigh_cm": 58}');

-- ============================================================================
-- FOCUS SESSIONS
-- ============================================================================

INSERT INTO focus_sessions (task_id, start_time, end_time, duration_minutes, was_successful, notes) VALUES
  ('c5555555-5555-5555-5555-555555555555', '2025-12-21 09:00:00+00', '2025-12-21 11:00:00+00', 120, true, 'Implemented user authentication feature'),
  ('c5555555-5555-5555-5555-555555555555', '2025-12-21 14:00:00+00', '2025-12-21 15:30:00+00', 90, true, 'Created database schema and migrations'),
  ('c4444444-4444-4444-4444-444444444444', '2025-12-20 10:00:00+00', '2025-12-20 12:30:00+00', 150, true, 'Completed Next.js routing and API routes tutorial'),
  ('c1111111-1111-1111-1111-111111111111', '2025-12-20 15:00:00+00', '2025-12-20 15:45:00+00', 45, false, 'Got distracted by notifications, need better focus');
