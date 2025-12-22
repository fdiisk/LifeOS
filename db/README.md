# Life OS Database Schema

This directory contains the Supabase PostgreSQL database schema for Life OS.

## Schema Overview

### Goal Management Hierarchy
```
macro_goals (top-level goals)
    ├── micro_goals (sub-goals)
    │   └── tasks (actionable items)
    └── tasks (can also be standalone)
```

### Tables

#### Goal Management
- **macro_goals**: Top-level life goals
- **micro_goals**: Sub-goals that contribute to macro goals
- **tasks**: Actionable items linked to micro goals

#### Habit & Daily Tracking
- **habits**: Recurring habits to track
- **daily_logs**: Daily entries for tasks, habits, mood, and energy

#### Health & Fitness
- **nutrition_logs**: Meal and nutrition tracking
- **gym_logs**: Workout and exercise logs
- **body_metrics**: Weight, body fat, measurements

#### Productivity
- **focus_sessions**: Time-tracked focus/work sessions

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Run the Schema

**Option A: Using Supabase Dashboard**
1. Open your Supabase project
2. Go to SQL Editor
3. Copy the contents of `schema.sql`
4. Run the SQL script

**Option B: Using Supabase CLI**
```bash
supabase db reset
supabase db push
```

### 3. Update Environment Variables

Add to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Schema Features

### Foreign Key Relationships

- `tasks.micro_goal_id` → `micro_goals.id` (SET NULL on delete)
- `micro_goals.macro_goal_id` → `macro_goals.id` (CASCADE on delete)
- `daily_logs.task_id` → `tasks.id` (SET NULL on delete)
- `daily_logs.habit_id` → `habits.id` (SET NULL on delete)
- `focus_sessions.task_id` → `tasks.id` (SET NULL on delete)

### AI-Parsed Data (JSONB)

All tables include an `ai_parsed_data` JSONB column for storing:
- Raw AI model outputs
- Parsed structured data
- Metadata from AI processing
- Cache results to minimize API calls

Example structure:
```json
{
  "raw_response": "...",
  "parsed_at": "2025-12-22T00:00:00Z",
  "model": "xiaomi/mimo-v2-flash:free",
  "confidence": 0.95,
  "entities": {...}
}
```

### Timestamps

All tables include:
- `created_at`: Automatically set on insert
- `updated_at`: Automatically updated via trigger on any update

### Indexes

Date-based queries are optimized with indexes on:
- `log_date` columns (daily_logs, nutrition_logs, gym_logs, body_metrics)
- `start_time` (focus_sessions)
- `created_at` (all tables)

### Status Enums

**Goals (macro_goals, micro_goals):**
- `active`: Currently working on
- `completed`: Successfully finished
- `archived`: No longer relevant
- `abandoned`: Gave up on

**Tasks:**
- `pending`: Not started
- `in_progress`: Currently working
- `completed`: Finished
- `cancelled`: No longer needed

**Priority (tasks):**
- `low`, `medium`, `high`, `urgent`

## Row Level Security (RLS)

RLS is prepared but currently disabled. To enable per-user data isolation:

1. Uncomment the RLS enable statements in `schema.sql`
2. Add user authentication via Supabase Auth
3. Create RLS policies, example:

```sql
CREATE POLICY "Users can view their own tasks"
ON tasks FOR SELECT
USING (auth.uid() = user_id);
```

## Migrations

Future schema changes should be added as migration files:
```
db/
  ├── schema.sql           # Initial schema
  └── migrations/
      ├── 001_add_user_id.sql
      └── 002_add_tags.sql
```

## Query Examples

### Get tasks with their goal hierarchy
```sql
SELECT
  t.title as task,
  mg.title as micro_goal,
  ma.title as macro_goal
FROM tasks t
LEFT JOIN micro_goals mg ON t.micro_goal_id = mg.id
LEFT JOIN macro_goals ma ON mg.macro_goal_id = ma.id
WHERE t.status = 'pending'
ORDER BY t.priority DESC, t.due_date ASC;
```

### Get daily summary
```sql
SELECT
  dl.log_date,
  COUNT(DISTINCT dl.task_id) as tasks_logged,
  COUNT(DISTINCT dl.habit_id) as habits_logged,
  AVG(dl.energy_level) as avg_energy
FROM daily_logs dl
WHERE dl.log_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY dl.log_date
ORDER BY dl.log_date DESC;
```

### Get nutrition summary by date
```sql
SELECT
  log_date,
  SUM(total_calories) as total_calories,
  SUM(protein_grams) as total_protein,
  SUM(carbs_grams) as total_carbs,
  SUM(fats_grams) as total_fats
FROM nutrition_logs
WHERE log_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY log_date
ORDER BY log_date DESC;
```
