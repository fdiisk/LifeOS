import { supabase } from './supabase';
import { Task, MicroGoal, MacroGoal } from './types';

/**
 * Calculate task completion progress (0-100)
 */
export function calculateTaskProgress(task: Task): number {
  return task.status === 'completed' ? 100 : 0;
}

/**
 * Calculate micro goal progress based on its tasks (0-100)
 */
export async function calculateMicroGoalProgress(microGoalId: string): Promise<number> {
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, status')
    .eq('micro_goal_id', microGoalId)
    .neq('status', 'cancelled');

  if (error || !tasks || tasks.length === 0) {
    return 0;
  }

  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  const totalTasks = tasks.length;

  return Math.round((completedTasks / totalTasks) * 100);
}

/**
 * Calculate macro goal progress based on completed medium goals (0-100)
 * Uses cached progress_percentage from database, calculated by triggers based on completed micro_goals
 */
export async function calculateMacroGoalProgress(macroGoalId: string): Promise<number> {
  const { data: macroGoal, error } = await supabase
    .from('macro_goals')
    .select('progress_percentage, total_medium_goals, completed_medium_goals')
    .eq('id', macroGoalId)
    .single();

  if (error || !macroGoal) {
    return 0;
  }

  // Return cached progress if available
  if (macroGoal.progress_percentage !== null && macroGoal.progress_percentage !== undefined) {
    return macroGoal.progress_percentage;
  }

  // Fallback: calculate from counts
  if (macroGoal.total_medium_goals === 0) {
    return 0;
  }

  return Math.round((macroGoal.completed_medium_goals / macroGoal.total_medium_goals) * 100);
}

/**
 * Mark micro goal as completed
 * This updates is_completed flag and sets completed_at timestamp
 */
export async function completeMicroGoal(microGoalId: string): Promise<boolean> {
  const { error } = await supabase
    .from('micro_goals')
    .update({
      is_completed: true,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', microGoalId);

  return !error;
}

/**
 * Mark micro goal as incomplete
 * This resets is_completed flag and clears completed_at timestamp
 */
export async function incompleteMicroGoal(microGoalId: string): Promise<boolean> {
  const { error } = await supabase
    .from('micro_goals')
    .update({
      is_completed: false,
      status: 'active',
      completed_at: null,
    })
    .eq('id', microGoalId);

  return !error;
}

/**
 * Get aggregated metrics for a micro goal
 * Returns time, focus, and success aggregations from child tasks
 */
export async function getMicroGoalAggregations(microGoalId: string) {
  const { data: microGoal, error } = await supabase
    .from('micro_goals')
    .select('total_time_minutes, avg_focus_rating, avg_success_rating, is_completed')
    .eq('id', microGoalId)
    .single();

  if (error || !microGoal) {
    return {
      total_time_minutes: 0,
      avg_focus_rating: null,
      avg_success_rating: null,
      is_completed: false,
    };
  }

  return microGoal;
}

/**
 * Get macro goal with progress and children
 */
export async function getMacroGoalWithProgress(macroGoalId: string) {
  const { data: macroGoal, error: macroError } = await supabase
    .from('macro_goals')
    .select('*')
    .eq('id', macroGoalId)
    .single();

  if (macroError || !macroGoal) {
    return null;
  }

  const { data: microGoals, error: microError } = await supabase
    .from('micro_goals')
    .select('*')
    .eq('macro_goal_id', macroGoalId)
    .order('created_at', { ascending: true });

  if (microError) {
    return null;
  }

  // Calculate progress for each micro goal
  const microGoalsWithProgress = await Promise.all(
    (microGoals || []).map(async (mg: any) => {
      const progress = await calculateMicroGoalProgress(mg.id);

      // Get task count
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('micro_goal_id', mg.id)
        .neq('status', 'cancelled');

      return {
        ...mg,
        progress,
        task_count: count || 0,
      };
    })
  );

  const macroProgress = await calculateMacroGoalProgress(macroGoalId);

  return {
    ...macroGoal,
    progress: macroProgress,
    micro_goals: microGoalsWithProgress,
    micro_goal_count: microGoalsWithProgress.length,
  };
}

/**
 * Get micro goal with progress and tasks
 */
export async function getMicroGoalWithProgress(microGoalId: string) {
  const { data: microGoal, error: microError } = await supabase
    .from('micro_goals')
    .select('*, macro_goals(*)')
    .eq('id', microGoalId)
    .single();

  if (microError || !microGoal) {
    return null;
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('micro_goal_id', microGoalId)
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true });

  if (tasksError) {
    return null;
  }

  const progress = await calculateMicroGoalProgress(microGoalId);

  const completedTasks = (tasks || []).filter((t: any) => t.status === 'completed').length;
  const totalTasks = (tasks || []).filter((t: any) => t.status !== 'cancelled').length;

  return {
    ...microGoal,
    progress,
    tasks: tasks || [],
    task_count: totalTasks,
    completed_task_count: completedTasks,
  };
}

/**
 * Get goals grouped by life area
 */
export async function getGoalsByLifeArea() {
  const { data: macroGoals, error } = await supabase
    .from('macro_goals')
    .select('*')
    .order('created_at', { ascending: true });

  if (error || !macroGoals) {
    return {};
  }

  // Calculate progress for each macro goal
  const goalsWithProgress = await Promise.all(
    macroGoals.map(async (goal: any) => {
      const progress = await calculateMacroGoalProgress(goal.id);

      // Get micro goal count
      const { count } = await supabase
        .from('micro_goals')
        .select('*', { count: 'exact', head: true })
        .eq('macro_goal_id', goal.id);

      return {
        ...goal,
        progress,
        micro_goal_count: count || 0,
      };
    })
  );

  // Group by life_area (if available in ai_parsed_data)
  const grouped: Record<string, any[]> = {};

  goalsWithProgress.forEach((goal) => {
    const lifeArea = goal.ai_parsed_data?.life_area || 'general';
    if (!grouped[lifeArea]) {
      grouped[lifeArea] = [];
    }
    grouped[lifeArea].push(goal);
  });

  return grouped;
}

/**
 * Get task statistics
 */
export async function getTaskStats(filters?: {
  status?: string;
  priority?: string;
  micro_goal_id?: string;
}) {
  let query = supabase
    .from('tasks')
    .select('id, status, priority', { count: 'exact' });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.micro_goal_id) {
    query = query.eq('micro_goal_id', filters.micro_goal_id);
  }

  const { data, count, error } = await query;

  if (error) {
    return null;
  }

  const byStatus = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  const byPriority = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };

  (data || []).forEach((task: any) => {
    byStatus[task.status as keyof typeof byStatus]++;
    byPriority[task.priority as keyof typeof byPriority]++;
  });

  return {
    total: count || 0,
    by_status: byStatus,
    by_priority: byPriority,
  };
}
