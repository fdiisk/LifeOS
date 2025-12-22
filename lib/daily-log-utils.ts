import { supabase } from './supabase';
import { DailyLogWithStats } from './types';

/**
 * Calculate task and habit completion percentages for a given date
 */
export async function calculateDailyStats(date: string) {
  // Get all tasks for the date
  const { data: tasksData, error: tasksError } = await supabase
    .from('daily_logs')
    .select('task_id, tasks(id, title, status, completed_at)')
    .eq('log_date', date)
    .not('task_id', 'is', null);

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  }

  // Get all habits for the date
  const { data: habitsData, error: habitsError } = await supabase
    .from('daily_logs')
    .select('habit_id, habits(id, name)')
    .eq('log_date', date)
    .not('habit_id', 'is', null);

  if (habitsError) {
    console.error('Error fetching habits:', habitsError);
  }

  // Get all active tasks for the date (tasks due on or before this date)
  const { data: allTasksData, error: allTasksError } = await supabase
    .from('tasks')
    .select('id, title, status, completed_at')
    .lte('due_date', date)
    .neq('status', 'cancelled');

  if (allTasksError) {
    console.error('Error fetching all tasks:', allTasksError);
  }

  // Get all active habits
  const { data: allHabitsData, error: allHabitsError } = await supabase
    .from('habits')
    .select('id, name, frequency')
    .eq('is_active', true);

  if (allHabitsError) {
    console.error('Error fetching all habits:', allHabitsError);
  }

  const tasks = allTasksData || [];
  const habits = allHabitsData || [];
  const loggedTasks = tasksData || [];
  const loggedHabits = habitsData || [];

  // Calculate task completion
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const taskCompletionPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // Calculate habit completion (based on logged habits for the day)
  const completedHabits = loggedHabits.length;
  const totalHabits = habits.filter((h: any) => h.frequency === 'daily').length;
  const habitCompletionPercentage = totalHabits > 0
    ? Math.round((completedHabits / totalHabits) * 100)
    : 0;

  return {
    task_completion_percentage: taskCompletionPercentage,
    habit_completion_percentage: habitCompletionPercentage,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    total_habits: totalHabits,
    completed_habits: completedHabits,
  };
}

/**
 * Get daily log summary with tasks, habits, and stats
 */
export async function getDailyLogSummary(date: string): Promise<DailyLogWithStats | null> {
  // Get daily log entries for the date
  const { data: logsData, error: logsError } = await supabase
    .from('daily_logs')
    .select(`
      *,
      tasks(id, title, status, completed_at),
      habits(id, name)
    `)
    .eq('log_date', date);

  if (logsError) {
    console.error('Error fetching daily logs:', logsError);
    return null;
  }

  const logs = logsData || [];

  // Extract morning reflection and evening journal from notes
  const morningLog = logs.find((log: any) => log.notes?.includes('[MORNING]'));
  const eveningLog = logs.find((log: any) => log.notes?.includes('[EVENING]'));

  // Get mood and energy from the most recent log entry
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  // Extract tasks and habits
  const tasks = logs
    .filter((log: any) => log.task_id && log.tasks)
    .map((log: any) => ({
      id: log.tasks.id,
      title: log.tasks.title,
      status: log.tasks.status,
      completed_at: log.tasks.completed_at,
    }));

  const habits = logs
    .filter((log: any) => log.habit_id && log.habits)
    .map((log: any) => ({
      id: log.habits.id,
      name: log.habits.name,
      completed: true,
    }));

  // Calculate stats
  const stats = await calculateDailyStats(date);

  return {
    date,
    morning_reflection: morningLog?.notes?.replace('[MORNING]', '').trim() || null,
    evening_journal: eveningLog?.notes?.replace('[EVENING]', '').trim() || null,
    mood: latestLog?.mood || null,
    energy_level: latestLog?.energy_level || null,
    tasks,
    habits,
    stats,
  };
}

/**
 * Create or update a daily log entry
 */
export async function upsertDailyLog(data: {
  log_date: string;
  task_id?: string | null;
  habit_id?: string | null;
  notes?: string | null;
  mood?: string | null;
  energy_level?: number | null;
  ai_parsed_data?: Record<string, any> | null;
}) {
  const { data: result, error } = await supabase
    .from('daily_logs')
    .upsert(data, {
      onConflict: 'log_date,task_id,habit_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return result;
}
