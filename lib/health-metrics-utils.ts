import { supabase } from './supabase';

/**
 * Calculate calories burned from steps
 * Formula: steps × 0.04 (average for 150 lb person)
 * Adjusted by weight: (weight_lbs / 150) × steps × 0.04
 */
export function calculateCaloriesFromSteps(
  steps: number,
  weight_lbs?: number
): number {
  const baseCaloriesPerStep = 0.04;
  const weightFactor = weight_lbs ? weight_lbs / 150 : 1;
  return Math.round(steps * baseCaloriesPerStep * weightFactor);
}

/**
 * Calculate calories burned from running
 * Formula: weight_kg × distance_km × 1.036
 */
export function calculateCaloriesFromRunning(
  distance_km: number,
  weight_kg: number
): number {
  return Math.round(distance_km * weight_kg * 1.036);
}

/**
 * Calculate pace in min/km or min/mile
 */
export function calculatePace(
  duration_minutes: number,
  distance: number
): number {
  if (distance === 0) return 0;
  return Math.round((duration_minutes / distance) * 100) / 100;
}

/**
 * Convert between units
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 100) / 100;
}

export function lbsToKg(lbs: number): number {
  return Math.round(lbs / 2.20462 * 100) / 100;
}

export function kmToMiles(km: number): number {
  return Math.round(km * 0.621371 * 100) / 100;
}

export function milesToKm(miles: number): number {
  return Math.round(miles / 0.621371 * 100) / 100;
}

/**
 * Get daily net calories (intake - burned)
 */
export async function getDailyNetCalories(date: string, user_weight_kg?: number) {
  // Get nutrition intake
  const { data: nutritionLogs, error: nutritionError } = await supabase
    .from('nutrition_logs')
    .select('total_calories')
    .eq('log_date', date);

  if (nutritionError) {
    console.error('Error fetching nutrition logs:', nutritionError);
  }

  const totalIntake = (nutritionLogs || []).reduce(
    (sum, log) => sum + (log.total_calories || 0),
    0
  );

  // Get gym workouts
  const { data: gymLogs, error: gymError } = await supabase
    .from('gym_logs')
    .select('exercises, duration_minutes')
    .eq('log_date', date);

  if (gymError) {
    console.error('Error fetching gym logs:', gymError);
  }

  // Estimate calories burned from gym (rough estimate based on duration)
  // Average: 5-10 calories per minute depending on intensity
  // Using 7.5 as middle ground
  let gymCaloriesBurned = 0;
  (gymLogs || []).forEach((log) => {
    if (log.duration_minutes) {
      gymCaloriesBurned += log.duration_minutes * 7.5;
    }
  });

  // Get focus sessions (sedentary activity)
  const { data: focusSessions, error: focusError } = await supabase
    .from('focus_sessions')
    .select('duration_minutes')
    .eq('start_time::date', date)
    .not('end_time', 'is', null);

  if (focusError) {
    console.error('Error fetching focus sessions:', focusError);
  }

  // Sedentary activity: ~1.5 calories per minute
  let sedentaryCaloriesBurned = 0;
  (focusSessions || []).forEach((session) => {
    if (session.duration_minutes) {
      sedentaryCaloriesBurned += session.duration_minutes * 1.5;
    }
  });

  // Get latest weight for BMR calculation
  let weight_kg: number;
  if (user_weight_kg) {
    weight_kg = user_weight_kg;
  } else {
    const { data: latestWeight } = await supabase
      .from('body_metrics')
      .select('weight_kg')
      .not('weight_kg', 'is', null)
      .lte('log_date', date)
      .order('log_date', { ascending: false })
      .limit(1)
      .single();

    weight_kg = latestWeight?.weight_kg || 70; // Default 70kg if no data
  }

  // Calculate BMR (Basal Metabolic Rate) - simplified Mifflin-St Jeor
  // For average person: ~1.2 calories per kg per hour
  // Daily BMR = weight_kg × 24 × 1.2
  const bmrDaily = weight_kg * 24 * 1.2;

  const totalBurned = Math.round(bmrDaily + gymCaloriesBurned + sedentaryCaloriesBurned);
  const netCalories = totalIntake - totalBurned;

  return {
    date,
    intake: totalIntake,
    burned: {
      bmr: Math.round(bmrDaily),
      gym: Math.round(gymCaloriesBurned),
      sedentary: Math.round(sedentaryCaloriesBurned),
      total: totalBurned,
    },
    net_calories: netCalories,
    status: netCalories > 0 ? 'surplus' : netCalories < 0 ? 'deficit' : 'maintenance',
  };
}

/**
 * Get weekly health summary
 */
export async function getWeeklySummary(startDate: string, endDate: string) {
  // Get body weight data
  const { data: weights, error: weightError } = await supabase
    .from('body_metrics')
    .select('log_date, weight_kg, body_fat_percentage')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: true });

  if (weightError) {
    console.error('Error fetching weights:', weightError);
  }

  const weightData = weights || [];
  const avgWeight = weightData.length > 0
    ? weightData.reduce((sum, w) => sum + (w.weight_kg || 0), 0) / weightData.length
    : 0;
  const weightChange = weightData.length > 1
    ? (weightData[weightData.length - 1].weight_kg || 0) - (weightData[0].weight_kg || 0)
    : 0;

  // Get nutrition data
  const { data: nutrition, error: nutritionError } = await supabase
    .from('nutrition_logs')
    .select('log_date, total_calories, protein_grams, carbs_grams, fats_grams')
    .gte('log_date', startDate)
    .lte('log_date', endDate);

  if (nutritionError) {
    console.error('Error fetching nutrition:', nutritionError);
  }

  const nutritionData = nutrition || [];
  const totalCaloriesIntake = nutritionData.reduce((sum, n) => sum + (n.total_calories || 0), 0);
  const avgCaloriesPerDay = nutritionData.length > 0
    ? totalCaloriesIntake / nutritionData.length
    : 0;

  // Get gym data
  const { data: gym, error: gymError } = await supabase
    .from('gym_logs')
    .select('log_date, duration_minutes, workout_type')
    .gte('log_date', startDate)
    .lte('log_date', endDate);

  if (gymError) {
    console.error('Error fetching gym logs:', gymError);
  }

  const gymData = gym || [];
  const totalWorkoutMinutes = gymData.reduce((sum, g) => sum + (g.duration_minutes || 0), 0);
  const workoutCount = gymData.length;

  // Calculate daily net calories for each day
  const days: string[] = [];
  let currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);

  while (currentDate <= endDateObj) {
    days.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const dailyNetCalories = await Promise.all(
    days.map(async (date) => {
      return await getDailyNetCalories(date, avgWeight);
    })
  );

  const avgNetCalories = dailyNetCalories.length > 0
    ? dailyNetCalories.reduce((sum, d) => sum + d.net_calories, 0) / dailyNetCalories.length
    : 0;

  return {
    period: {
      start_date: startDate,
      end_date: endDate,
      days: days.length,
    },
    weight: {
      average_kg: Math.round(avgWeight * 100) / 100,
      average_lbs: kgToLbs(avgWeight),
      change_kg: Math.round(weightChange * 100) / 100,
      change_lbs: kgToLbs(weightChange),
      measurements: weightData.length,
    },
    nutrition: {
      total_calories: totalCaloriesIntake,
      avg_calories_per_day: Math.round(avgCaloriesPerDay),
      logged_days: nutritionData.length,
    },
    activity: {
      total_workout_minutes: totalWorkoutMinutes,
      workout_count: workoutCount,
      avg_workout_duration: workoutCount > 0 ? Math.round(totalWorkoutMinutes / workoutCount) : 0,
    },
    calories: {
      avg_net_per_day: Math.round(avgNetCalories),
      total_net: Math.round(avgNetCalories * days.length),
      status: avgNetCalories > 0 ? 'surplus' : avgNetCalories < 0 ? 'deficit' : 'maintenance',
    },
    daily_breakdown: dailyNetCalories,
  };
}

/**
 * Get weight trend data for graphs
 */
export async function getWeightTrend(startDate: string, endDate: string) {
  const { data: weights, error } = await supabase
    .from('body_metrics')
    .select('log_date, weight_kg, body_fat_percentage, muscle_mass_kg')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: true });

  if (error) {
    console.error('Error fetching weight trend:', error);
    return [];
  }

  return (weights || []).map((w) => ({
    date: w.log_date,
    weight_kg: w.weight_kg,
    weight_lbs: w.weight_kg ? kgToLbs(w.weight_kg) : null,
    body_fat_percentage: w.body_fat_percentage,
    muscle_mass_kg: w.muscle_mass_kg,
    muscle_mass_lbs: w.muscle_mass_kg ? kgToLbs(w.muscle_mass_kg) : null,
  }));
}

/**
 * Get calories trend data for graphs
 */
export async function getCaloriesTrend(startDate: string, endDate: string) {
  const days: string[] = [];
  let currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);

  while (currentDate <= endDateObj) {
    days.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const caloriesData = await Promise.all(
    days.map(async (date) => {
      const netData = await getDailyNetCalories(date);
      return {
        date,
        intake: netData.intake,
        burned: netData.burned.total,
        net: netData.net_calories,
        status: netData.status,
      };
    })
  );

  return caloriesData;
}

/**
 * Get workout trend data for graphs
 */
export async function getWorkoutTrend(startDate: string, endDate: string) {
  const { data: workouts, error } = await supabase
    .from('gym_logs')
    .select('log_date, duration_minutes, workout_type, exercises')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: true });

  if (error) {
    console.error('Error fetching workout trend:', error);
    return [];
  }

  // Group by date to handle multiple workouts per day
  const groupedByDate: Record<string, any[]> = {};
  (workouts || []).forEach((w) => {
    if (!groupedByDate[w.log_date]) {
      groupedByDate[w.log_date] = [];
    }
    groupedByDate[w.log_date].push(w);
  });

  return Object.entries(groupedByDate).map(([date, dayWorkouts]) => {
    const totalDuration = dayWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    const workoutTypes = [...new Set(dayWorkouts.map((w) => w.workout_type))];

    return {
      date,
      duration_minutes: totalDuration,
      workout_count: dayWorkouts.length,
      workout_types: workoutTypes,
    };
  });
}
