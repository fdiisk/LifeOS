// Ratings Utilities
// Calculate objective ratings and provide perceived vs actual comparisons

import { supabase } from './supabase';

export interface ObjectiveRating {
  date: string;
  overall_score: number;
  task_completion_score: number;
  habit_completion_score: number;
  workout_adherence_score: number;
  nutrition_logging_score: number;
  breakdown: {
    tasks: { completed: number; total: number; percentage: number };
    habits: { completed: number; total: number; percentage: number };
    workouts: { logged: boolean; score: number };
    nutrition: { meals_logged: number; expected: number; percentage: number };
  };
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  subjective: {
    avg_focus: number;
    avg_effort: number;
    avg_mood: number;
    avg_overall_subjective: number;
  };
  objective: {
    avg_overall: number;
    avg_task_completion: number;
    avg_habit_completion: number;
    avg_workout_adherence: number;
    avg_nutrition_logging: number;
  };
  trend: {
    focus: 'improving' | 'stable' | 'declining';
    effort: 'improving' | 'stable' | 'declining';
    mood: 'improving' | 'stable' | 'declining';
    objective: 'improving' | 'stable' | 'declining';
  };
  days_rated: number;
  total_days: number;
}

export interface PerceivedVsActual {
  date: string;
  subjective: {
    focus: number;
    effort: number;
    mood: number;
    average: number;
  };
  objective: {
    overall: number;
    task_completion: number;
    habit_completion: number;
  };
  gap: {
    effort_vs_completion: number; // effort - actual completion
    perception_accuracy: number; // 100 - abs(gap)
    category: 'accurate' | 'overestimating' | 'underestimating';
  };
  insight: string;
}

/**
 * Calculate objective rating for a given date based on actual performance
 */
export async function calculateObjectiveRating(date: string): Promise<ObjectiveRating> {
  // Get task completion for the date
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, status, completed_at')
    .or(`due_date.eq.${date},completed_at.gte.${date},completed_at.lt.${getNextDay(date)}`);

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t =>
    t.status === 'completed' &&
    t.completed_at &&
    t.completed_at.startsWith(date)
  ).length || 0;
  const taskCompletionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get habit completions for the date
  const { data: allHabits } = await supabase
    .from('habits')
    .select('id')
    .eq('is_active', true);

  const { data: habitCompletions } = await supabase
    .from('habit_completions')
    .select('habit_id')
    .eq('completion_date', date);

  const totalHabits = allHabits?.length || 0;
  const completedHabits = habitCompletions?.length || 0;
  const habitCompletionPercentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

  // Check if workout was logged
  const { data: gymLog } = await supabase
    .from('gym_logs')
    .select('id')
    .eq('log_date', date)
    .single();

  const workoutLogged = !!gymLog;
  const workoutScore = workoutLogged ? 100 : 0;

  // Check nutrition logging (expect 3 meals: breakfast, lunch, dinner)
  const { data: nutritionLogs } = await supabase
    .from('nutrition_logs')
    .select('meal_type')
    .eq('log_date', date);

  const mealsLogged = nutritionLogs?.length || 0;
  const expectedMeals = 3; // breakfast, lunch, dinner
  const nutritionLoggingPercentage = Math.round((mealsLogged / expectedMeals) * 100);

  // Calculate weighted overall score
  // Task completion: 35%, Habit completion: 35%, Workout: 15%, Nutrition: 15%
  const overallScore = Math.round(
    taskCompletionPercentage * 0.35 +
    habitCompletionPercentage * 0.35 +
    workoutScore * 0.15 +
    nutritionLoggingPercentage * 0.15
  );

  return {
    date,
    overall_score: overallScore,
    task_completion_score: taskCompletionPercentage,
    habit_completion_score: habitCompletionPercentage,
    workout_adherence_score: workoutScore,
    nutrition_logging_score: nutritionLoggingPercentage,
    breakdown: {
      tasks: {
        completed: completedTasks,
        total: totalTasks,
        percentage: taskCompletionPercentage,
      },
      habits: {
        completed: completedHabits,
        total: totalHabits,
        percentage: habitCompletionPercentage,
      },
      workouts: {
        logged: workoutLogged,
        score: workoutScore,
      },
      nutrition: {
        meals_logged: mealsLogged,
        expected: expectedMeals,
        percentage: nutritionLoggingPercentage,
      },
    },
  };
}

/**
 * Calculate weekly summary with trends
 */
export async function calculateWeeklySummary(weekStart: string): Promise<WeeklySummary> {
  const weekEnd = getDateDaysLater(weekStart, 6);
  const days = getDaysInRange(weekStart, weekEnd);

  // Get subjective ratings for the week
  const { data: ratings } = await supabase
    .from('daily_ratings')
    .select('*')
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date', { ascending: true });

  const daysRated = ratings?.length || 0;

  // Calculate subjective averages
  let avgFocus = 0;
  let avgEffort = 0;
  let avgMood = 0;

  if (ratings && ratings.length > 0) {
    avgFocus = Math.round(ratings.reduce((sum, r) => sum + r.focus_rating, 0) / ratings.length);
    avgEffort = Math.round(ratings.reduce((sum, r) => sum + r.effort_rating, 0) / ratings.length);
    avgMood = Math.round(ratings.reduce((sum, r) => sum + r.mood_rating, 0) / ratings.length);
  }

  const avgOverallSubjective = Math.round((avgFocus + avgEffort + avgMood) / 3);

  // Calculate objective ratings for each day
  const objectiveRatings = await Promise.all(
    days.map(day => calculateObjectiveRating(day))
  );

  const avgOverallObjective = Math.round(
    objectiveRatings.reduce((sum, r) => sum + r.overall_score, 0) / objectiveRatings.length
  );
  const avgTaskCompletion = Math.round(
    objectiveRatings.reduce((sum, r) => sum + r.task_completion_score, 0) / objectiveRatings.length
  );
  const avgHabitCompletion = Math.round(
    objectiveRatings.reduce((sum, r) => sum + r.habit_completion_score, 0) / objectiveRatings.length
  );
  const avgWorkoutAdherence = Math.round(
    objectiveRatings.reduce((sum, r) => sum + r.workout_adherence_score, 0) / objectiveRatings.length
  );
  const avgNutritionLogging = Math.round(
    objectiveRatings.reduce((sum, r) => sum + r.nutrition_logging_score, 0) / objectiveRatings.length
  );

  // Calculate trends (compare first half vs second half of week)
  const focusTrend = calculateTrend(ratings?.map(r => r.focus_rating) || []);
  const effortTrend = calculateTrend(ratings?.map(r => r.effort_rating) || []);
  const moodTrend = calculateTrend(ratings?.map(r => r.mood_rating) || []);
  const objectiveTrend = calculateTrend(objectiveRatings.map(r => r.overall_score));

  return {
    week_start: weekStart,
    week_end: weekEnd,
    subjective: {
      avg_focus: avgFocus,
      avg_effort: avgEffort,
      avg_mood: avgMood,
      avg_overall_subjective: avgOverallSubjective,
    },
    objective: {
      avg_overall: avgOverallObjective,
      avg_task_completion: avgTaskCompletion,
      avg_habit_completion: avgHabitCompletion,
      avg_workout_adherence: avgWorkoutAdherence,
      avg_nutrition_logging: avgNutritionLogging,
    },
    trend: {
      focus: focusTrend,
      effort: effortTrend,
      mood: moodTrend,
      objective: objectiveTrend,
    },
    days_rated: daysRated,
    total_days: days.length,
  };
}

/**
 * Compare perceived (subjective) vs actual (objective) performance
 */
export async function calculatePerceivedVsActual(date: string): Promise<PerceivedVsActual> {
  // Get subjective rating
  const { data: rating } = await supabase
    .from('daily_ratings')
    .select('*')
    .eq('date', date)
    .single();

  if (!rating) {
    throw new Error(`No rating found for date: ${date}`);
  }

  // Get objective rating
  const objective = await calculateObjectiveRating(date);

  // Calculate subjective average
  const subjectiveAvg = Math.round(
    (rating.focus_rating + rating.effort_rating + rating.mood_rating) / 3
  );

  // Calculate gap between effort and actual completion
  // Positive gap = overestimating (high effort, low completion)
  // Negative gap = underestimating (low effort, high completion)
  const effortVsCompletion = rating.effort_rating - objective.overall_score;

  // Perception accuracy (how close effort aligns with objective)
  const perceptionAccuracy = Math.max(0, 100 - Math.abs(effortVsCompletion));

  // Categorize
  let category: 'accurate' | 'overestimating' | 'underestimating';
  if (Math.abs(effortVsCompletion) <= 15) {
    category = 'accurate';
  } else if (effortVsCompletion > 0) {
    category = 'overestimating';
  } else {
    category = 'underestimating';
  }

  // Generate insight
  let insight = '';
  if (category === 'accurate') {
    insight = 'Your perceived effort aligns well with actual performance. Great self-awareness!';
  } else if (category === 'overestimating') {
    if (rating.effort_rating >= 70 && objective.overall_score < 50) {
      insight = 'You felt you put in significant effort, but completion was lower than expected. Consider if there are blockers or if tasks are taking longer than anticipated.';
    } else {
      insight = 'Your perceived effort is slightly higher than actual completion. This could indicate inefficiencies or distractions.';
    }
  } else {
    if (objective.overall_score >= 70 && rating.effort_rating < 50) {
      insight = 'You accomplished a lot with relatively low perceived effort. This suggests good flow state or well-suited tasks!';
    } else {
      insight = 'You may be underestimating your effort. Give yourself more credit for what you accomplished.';
    }
  }

  return {
    date,
    subjective: {
      focus: rating.focus_rating,
      effort: rating.effort_rating,
      mood: rating.mood_rating,
      average: subjectiveAvg,
    },
    objective: {
      overall: objective.overall_score,
      task_completion: objective.task_completion_score,
      habit_completion: objective.habit_completion_score,
    },
    gap: {
      effort_vs_completion: effortVsCompletion,
      perception_accuracy: perceptionAccuracy,
      category,
    },
    insight,
  };
}

/**
 * Helper: Get next day date string
 */
function getNextDay(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Helper: Get date N days later
 */
function getDateDaysLater(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Helper: Get array of dates in range (inclusive)
 */
function getDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Helper: Calculate trend from array of values
 */
function calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
  if (values.length < 2) return 'stable';

  const midpoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midpoint);
  const secondHalf = values.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

  const difference = secondAvg - firstAvg;

  // Use threshold of 5 points to determine trend
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}
