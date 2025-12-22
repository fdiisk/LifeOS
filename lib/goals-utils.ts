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
 * Calculate macro goal progress based on its micro goals (0-100)
 */
export async function calculateMacroGoalProgress(macroGoalId: string): Promise<number> {
  const { data: microGoals, error } = await supabase
    .from('micro_goals')
    .select('id, status')
    .eq('macro_goal_id', macroGoalId)
    .neq('status', 'abandoned');

  if (error || !microGoals || microGoals.length === 0) {
    return 0;
  }

  // Calculate progress for each micro goal
  const progressValues = await Promise.all(
    microGoals.map(async (mg: any) => {
      if (mg.status === 'completed') {
        return 100;
      }
      return await calculateMicroGoalProgress(mg.id);
    })
  );

  const totalProgress = progressValues.reduce((sum, progress) => sum + progress, 0);
  const avgProgress = totalProgress / microGoals.length;

  return Math.round(avgProgress);
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
