// Life OS TypeScript Types

export interface MacroGoal {
  id: string;
  title: string;
  description: string | null;
  status: 'active' | 'completed' | 'archived' | 'abandoned';
  target_date: string | null;
  ai_parsed_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface MicroGoal {
  id: string;
  macro_goal_id: string | null;
  title: string;
  description: string | null;
  status: 'active' | 'completed' | 'archived' | 'abandoned';
  target_date: string | null;
  ai_parsed_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  micro_goal_id: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  completed_at: string | null;
  ai_parsed_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  is_active: boolean;
  ai_parsed_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  log_date: string;
  task_id: string | null;
  habit_id: string | null;
  notes: string | null;
  mood: string | null;
  energy_level: number | null;
  ai_parsed_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface DailyLogWithStats {
  date: string;
  morning_reflection: string | null;
  evening_journal: string | null;
  mood: string | null;
  energy_level: number | null;
  tasks: {
    id: string;
    title: string;
    status: string;
    completed_at: string | null;
  }[];
  habits: {
    id: string;
    name: string;
    completed: boolean;
  }[];
  stats: {
    task_completion_percentage: number;
    habit_completion_percentage: number;
    total_tasks: number;
    completed_tasks: number;
    total_habits: number;
    completed_habits: number;
  };
}

export interface NutritionLog {
  id: string;
  log_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_items: Record<string, any>;
  total_calories: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fats_grams: number | null;
  notes: string | null;
  ai_parsed_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface GymLog {
  id: string;
  log_date: string;
  workout_type: string;
  exercises: Record<string, any>;
  duration_minutes: number | null;
  notes: string | null;
  ai_parsed_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface BodyMetric {
  id: string;
  log_date: string;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  muscle_mass_kg: number | null;
  measurements: Record<string, any> | null;
  notes: string | null;
  ai_parsed_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface FocusSession {
  id: string;
  task_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  was_successful: boolean | null;
  ai_parsed_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
