import { supabase } from './supabase';

interface HabitCompletion {
  log_date: string;
}

/**
 * Calculate current streak for a habit
 * Counts consecutive days from today backwards
 */
export async function calculateCurrentStreak(habitId: string): Promise<number> {
  const { data: completions, error } = await supabase
    .from('daily_logs')
    .select('log_date')
    .eq('habit_id', habitId)
    .order('log_date', { ascending: false });

  if (error || !completions || completions.length === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let checkDate = new Date(today);

  // Convert completions to a Set for O(1) lookup
  const completionDates = new Set(
    completions.map((c: HabitCompletion) => c.log_date)
  );

  // Check if today or yesterday was completed (allow 1 day grace)
  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(new Date(today.getTime() - 86400000));

  if (!completionDates.has(todayStr) && !completionDates.has(yesterdayStr)) {
    return 0; // Streak is broken
  }

  // Start from today and count backwards
  while (completionDates.has(formatDate(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return currentStreak;
}

/**
 * Calculate longest streak for a habit in its history
 */
export async function calculateLongestStreak(habitId: string): Promise<number> {
  const { data: completions, error } = await supabase
    .from('daily_logs')
    .select('log_date')
    .eq('habit_id', habitId)
    .order('log_date', { ascending: true });

  if (error || !completions || completions.length === 0) {
    return 0;
  }

  let longestStreak = 0;
  let currentStreak = 1;
  let prevDate: Date | null = null;

  for (const completion of completions) {
    const currentDate = new Date(completion.log_date);
    currentDate.setHours(0, 0, 0, 0);

    if (prevDate) {
      const diffDays = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / 86400000
      );

      if (diffDays === 1) {
        // Consecutive day
        currentStreak++;
      } else if (diffDays === 0) {
        // Same day (duplicate entry, ignore)
        continue;
      } else {
        // Gap in streak
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }

    prevDate = currentDate;
  }

  return Math.max(longestStreak, currentStreak);
}

/**
 * Calculate consistency score (0-100)
 * Rewards regular completion, penalizes sporadic bursts
 */
export async function calculateConsistencyScore(
  habitId: string,
  days: number = 30
): Promise<number> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: completions, error } = await supabase
    .from('daily_logs')
    .select('log_date')
    .eq('habit_id', habitId)
    .gte('log_date', formatDate(startDate))
    .order('log_date', { ascending: true });

  if (error || !completions || completions.length === 0) {
    return 0;
  }

  const completionCount = completions.length;
  const completionRate = completionCount / days;

  // Calculate gap consistency (lower variance = higher consistency)
  const gaps: number[] = [];
  let prevDate: Date | null = null;

  for (const completion of completions) {
    const currentDate = new Date(completion.log_date);
    currentDate.setHours(0, 0, 0, 0);

    if (prevDate) {
      const gap = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / 86400000
      );
      if (gap > 0) {
        gaps.push(gap);
      }
    }

    prevDate = currentDate;
  }

  // If only one completion, low consistency
  if (gaps.length === 0) {
    return Math.min(completionRate * 50, 50);
  }

  // Calculate average gap and standard deviation
  const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const variance =
    gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);

  // Consistency factor: penalize high variance
  // Perfect consistency (gap = 1 every day) has stdDev = 0
  // Higher stdDev means more sporadic
  const consistencyFactor = Math.max(0, 1 - stdDev / 7); // Normalize by week

  // Combine completion rate with consistency
  // 70% weight on completion rate, 30% on consistency
  const score = (completionRate * 0.7 + consistencyFactor * 0.3) * 100;

  return Math.round(Math.min(score, 100));
}

/**
 * Get comprehensive habit statistics
 */
export async function getHabitStats(habitId: string) {
  const [currentStreak, longestStreak, consistencyScore] = await Promise.all([
    calculateCurrentStreak(habitId),
    calculateLongestStreak(habitId),
    calculateConsistencyScore(habitId, 30),
  ]);

  // Get total completions
  const { count: totalCompletions } = await supabase
    .from('daily_logs')
    .select('*', { count: 'exact', head: true })
    .eq('habit_id', habitId);

  // Get completions in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: completionsLast7Days } = await supabase
    .from('daily_logs')
    .select('*', { count: 'exact', head: true })
    .eq('habit_id', habitId)
    .gte('log_date', formatDate(sevenDaysAgo));

  // Get completions in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: completionsLast30Days } = await supabase
    .from('daily_logs')
    .select('*', { count: 'exact', head: true })
    .eq('habit_id', habitId)
    .gte('log_date', formatDate(thirtyDaysAgo));

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    consistency_score: consistencyScore,
    total_completions: totalCompletions || 0,
    completions_last_7_days: completionsLast7Days || 0,
    completions_last_30_days: completionsLast30Days || 0,
    completion_rate_7_days: Math.round(((completionsLast7Days || 0) / 7) * 100),
    completion_rate_30_days: Math.round(((completionsLast30Days || 0) / 30) * 100),
  };
}

/**
 * Get habit completion calendar for a date range
 */
export async function getHabitCalendar(
  habitId: string,
  startDate: string,
  endDate: string
) {
  const { data: completions, error } = await supabase
    .from('daily_logs')
    .select('log_date, notes, mood, energy_level')
    .eq('habit_id', habitId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: true });

  if (error) {
    return [];
  }

  return completions || [];
}

/**
 * Check if habit is completed for a specific date
 */
export async function isHabitCompletedOnDate(
  habitId: string,
  date: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('log_date', date)
    .maybeSingle();

  return !error && data !== null;
}

/**
 * Get all habits with their current stats
 */
export async function getAllHabitsWithStats(filters?: {
  is_active?: boolean;
  frequency?: string;
}) {
  let query = supabase.from('habits').select('*').order('created_at', { ascending: false });

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }
  if (filters?.frequency) {
    query = query.eq('frequency', filters.frequency);
  }

  const { data: habits, error } = await query;

  if (error || !habits) {
    return [];
  }

  // Get stats for each habit
  const habitsWithStats = await Promise.all(
    habits.map(async (habit: any) => {
      const stats = await getHabitStats(habit.id);
      return {
        ...habit,
        stats,
      };
    })
  );

  return habitsWithStats;
}

/**
 * Helper function to format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
