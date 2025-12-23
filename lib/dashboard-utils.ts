// Dashboard Data Utilities
// Client-side functions for fetching dashboard data

import { format, subDays, subMonths, startOfWeek, endOfWeek } from 'date-fns';

export type TimeScale = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface GoalProgressData {
  date: string;
  progress: number;
  goalTitle: string;
  goalId: string;
}

export interface LifeAreaData {
  date: string;
  financial: number;
  personal: number;
  relationships: number;
  recreation: number;
  career: number;
  hobbies: number;
  health: number;
}

export interface RatingsComparisonData {
  date: string;
  subjective: number;
  objective: number;
  gap: number;
}

export interface FocusHeatmapData {
  hour: number;
  day: string;
  value: number;
}

/**
 * Get date range based on time scale
 */
export function getDateRange(scale: TimeScale): { start: string; end: string } {
  const today = new Date();
  const endDate = format(today, 'yyyy-MM-dd');
  let startDate: string;

  switch (scale) {
    case 'day':
      startDate = format(subDays(today, 7), 'yyyy-MM-dd');
      break;
    case 'week':
      startDate = format(subDays(today, 28), 'yyyy-MM-dd'); // 4 weeks
      break;
    case 'month':
      startDate = format(subMonths(today, 3), 'yyyy-MM-dd');
      break;
    case 'quarter':
      startDate = format(subMonths(today, 6), 'yyyy-MM-dd');
      break;
    case 'year':
      startDate = format(subMonths(today, 12), 'yyyy-MM-dd');
      break;
    default:
      startDate = format(subMonths(today, 6), 'yyyy-MM-dd');
  }

  return { start: startDate, end: endDate };
}

/**
 * Fetch macro goal progress over time
 */
export async function fetchGoalProgress(
  goalId: string,
  timeScale: TimeScale = 'quarter'
): Promise<GoalProgressData[]> {
  try {
    const { start, end } = getDateRange(timeScale);

    // Get the goal details
    const goalRes = await fetch(`/api/macro-goals/${goalId}`);
    if (!goalRes.ok) throw new Error('Failed to fetch goal');
    const goalData = await goalRes.json();

    // Generate date points for the range
    const dates = generateDatePoints(start, end, timeScale);

    // For each date, we'll need to calculate progress
    // This is a simplified version - you might want to cache this data
    const progressData: GoalProgressData[] = dates.map((date) => ({
      date,
      progress: 0, // Will be calculated from micro goals/tasks
      goalTitle: goalData.macro_goal.title,
      goalId,
    }));

    return progressData;
  } catch (error) {
    console.error('Error fetching goal progress:', error);
    return [];
  }
}

/**
 * Fetch all active macro goals progress (for 6 months)
 */
export async function fetchAllGoalsProgress(): Promise<GoalProgressData[]> {
  try {
    const res = await fetch('/api/macro-goals?status=active');
    if (!res.ok) throw new Error('Failed to fetch goals');
    const data = await res.json();

    const { start, end } = getDateRange('quarter');
    const dates = generateDatePoints(start, end, 'week');

    const allProgress: GoalProgressData[] = [];

    for (const goal of data.macro_goals || []) {
      for (const date of dates) {
        allProgress.push({
          date,
          progress: goal.progress || 0,
          goalTitle: goal.title,
          goalId: goal.id,
        });
      }
    }

    return allProgress;
  } catch (error) {
    console.error('Error fetching all goals progress:', error);
    return [];
  }
}

/**
 * Fetch life areas progress over time (normalized)
 */
export async function fetchLifeAreasProgress(
  timeScale: TimeScale = 'quarter'
): Promise<LifeAreaData[]> {
  try {
    const { start, end } = getDateRange(timeScale);
    const dates = generateDatePoints(start, end, timeScale);

    // Fetch tasks grouped by life area
    const tasksRes = await fetch('/api/tasks');
    if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
    const tasksData = await tasksRes.json();

    // Group tasks by life area and calculate completion percentage
    const lifeAreaData: LifeAreaData[] = dates.map((date) => ({
      date,
      financial: Math.floor(Math.random() * 100), // Placeholder - calculate from actual data
      personal: Math.floor(Math.random() * 100),
      relationships: Math.floor(Math.random() * 100),
      recreation: Math.floor(Math.random() * 100),
      career: Math.floor(Math.random() * 100),
      hobbies: Math.floor(Math.random() * 100),
      health: Math.floor(Math.random() * 100),
    }));

    return lifeAreaData;
  } catch (error) {
    console.error('Error fetching life areas progress:', error);
    return [];
  }
}

/**
 * Fetch ratings comparison (subjective vs objective)
 */
export async function fetchRatingsComparison(
  timeScale: TimeScale = 'month'
): Promise<RatingsComparisonData[]> {
  try {
    const { start, end } = getDateRange(timeScale);

    const res = await fetch(
      `/api/ratings/comparison?start_date=${start}&end_date=${end}`
    );

    if (!res.ok) {
      // No ratings yet, return empty
      return [];
    }

    const data = await res.json();

    const comparisonData: RatingsComparisonData[] =
      data.comparisons?.map((c: any) => ({
        date: c.date,
        subjective: c.subjective.average,
        objective: c.objective.overall,
        gap: c.gap.effort_vs_completion,
      })) || [];

    return comparisonData;
  } catch (error) {
    console.error('Error fetching ratings comparison:', error);
    return [];
  }
}

/**
 * Fetch focus session heatmap data
 */
export async function fetchFocusHeatmap(days: number = 30): Promise<FocusHeatmapData[]> {
  try {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Fetch focus sessions
    const res = await fetch(
      `/api/focus-sessions?start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`
    );

    // If endpoint doesn't exist yet, return mock data
    if (!res.ok) {
      return generateMockHeatmapData(days);
    }

    const data = await res.json();

    // Convert to heatmap format
    const heatmapData: FocusHeatmapData[] = [];

    for (const session of data.sessions || []) {
      const startTime = new Date(session.start_time);
      const hour = startTime.getHours();
      const day = format(startTime, 'yyyy-MM-dd');
      const duration = session.duration_minutes || 0;

      heatmapData.push({
        hour,
        day,
        value: duration,
      });
    }

    return heatmapData;
  } catch (error) {
    console.error('Error fetching focus heatmap:', error);
    return generateMockHeatmapData(days);
  }
}

/**
 * Generate date points for a given range and scale
 */
function generateDatePoints(start: string, end: string, scale: TimeScale): string[] {
  const dates: string[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  const current = new Date(startDate);

  let increment: number;
  switch (scale) {
    case 'day':
      increment = 1;
      break;
    case 'week':
      increment = 7;
      break;
    case 'month':
      increment = 30;
      break;
    case 'quarter':
      increment = 7; // Weekly points for quarter view
      break;
    case 'year':
      increment = 30; // Monthly points for year view
      break;
    default:
      increment = 7;
  }

  while (current <= endDate) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current.setDate(current.getDate() + increment);
  }

  return dates;
}

/**
 * Generate mock heatmap data for development
 */
function generateMockHeatmapData(days: number): FocusHeatmapData[] {
  const heatmapData: FocusHeatmapData[] = [];
  const today = new Date();

  for (let d = 0; d < days; d++) {
    const date = subDays(today, d);
    const dayStr = format(date, 'yyyy-MM-dd');

    // Generate data for work hours (8am - 6pm)
    for (let hour = 8; hour <= 18; hour++) {
      // Higher values during typical focus hours (9-11am, 2-4pm)
      let value = 0;
      if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
        value = Math.floor(Math.random() * 90) + 30; // 30-120 minutes
      } else {
        value = Math.floor(Math.random() * 60); // 0-60 minutes
      }

      heatmapData.push({
        hour,
        day: dayStr,
        value,
      });
    }
  }

  return heatmapData;
}

/**
 * Fetch weekly ratings summary
 */
export async function fetchWeeklyRatings() {
  try {
    const res = await fetch('/api/ratings/weekly');
    if (!res.ok) return null;
    const data = await res.json();
    return data.summary;
  } catch (error) {
    console.error('Error fetching weekly ratings:', error);
    return null;
  }
}
