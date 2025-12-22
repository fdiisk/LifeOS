import { createHash } from 'crypto';
import { supabase } from './supabase';
import { callOpenRouter } from './openrouter';

export type ParseType = 'meal' | 'gym' | 'general';

export interface MealParsedResult {
  meal_name?: string;
  total_calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fats_grams?: number;
  ingredients: Array<{
    name: string;
    weight_grams?: number;
    calories?: number;
  }>;
  confidence: number;
  from_cache?: boolean;
}

export interface GymParsedResult {
  exercises: Array<{
    name: string;
    matched_equipment?: string;
    sets?: number;
    reps?: number;
    weight_lbs?: number;
    weight_kg?: number;
    duration_minutes?: number;
    notes?: string;
    confidence: number;
    needs_clarification?: boolean;
    clarification_question?: string;
  }>;
  workout_type?: string;
  total_duration_minutes?: number;
  from_cache?: boolean;
}

/**
 * Generate SHA-256 hash of normalized input text
 */
export function hashInput(text: string): string {
  // Normalize: lowercase, trim, remove extra whitespace
  const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Check if parsing result exists in cache
 */
export async function getCachedResult(
  inputText: string,
  parseType: ParseType
): Promise<any | null> {
  const hash = hashInput(inputText);

  const { data, error } = await supabase
    .from('ai_parse_cache')
    .select('parsed_result, access_count')
    .eq('input_hash', hash)
    .eq('parse_type', parseType)
    .single();

  if (error || !data) {
    return null;
  }

  // Update access count
  await supabase
    .from('ai_parse_cache')
    .update({
      last_accessed_at: new Date().toISOString(),
      access_count: data.access_count + 1,
    })
    .eq('input_hash', hash);

  return data.parsed_result;
}

/**
 * Store parsing result in cache
 */
export async function cacheResult(
  inputText: string,
  parseType: ParseType,
  parsedResult: any
): Promise<void> {
  const hash = hashInput(inputText);

  await supabase.from('ai_parse_cache').upsert({
    input_hash: hash,
    input_text: inputText,
    parse_type: parseType,
    parsed_result: parsedResult,
    model: 'xiaomi/mimo-v2-flash:free',
  }, {
    onConflict: 'input_hash',
  });
}

/**
 * Parse meal text using AI
 */
export async function parseMeal(text: string): Promise<MealParsedResult> {
  // Check cache first
  const cached = await getCachedResult(text, 'meal');
  if (cached) {
    return { ...cached, from_cache: true };
  }

  // Call AI
  const prompt = `You are a nutrition parsing assistant. Parse the following meal description and extract nutritional information.

MEAL DESCRIPTION:
${text}

Return a JSON object with this exact structure:
{
  "meal_name": "string (optional, inferred meal name)",
  "total_calories": number (optional, total estimated calories),
  "protein_grams": number (optional, total protein in grams),
  "carbs_grams": number (optional, total carbs in grams),
  "fats_grams": number (optional, total fats in grams),
  "ingredients": [
    {
      "name": "string (ingredient name)",
      "weight_grams": number (optional, estimated weight),
      "calories": number (optional, estimated calories for this ingredient)
    }
  ],
  "confidence": number (0-1, your confidence in the parsing)
}

RULES:
1. If weights are not specified, make reasonable assumptions based on typical serving sizes
2. Calculate macros based on standard nutritional data
3. Set confidence based on how explicit the input is
4. If completely unable to parse, return confidence 0 with empty ingredients array
5. Return ONLY valid JSON, no additional text

RESPOND WITH JSON ONLY:`;

  const response = await callOpenRouter([
    { role: 'user', content: prompt }
  ]);

  // Parse JSON response
  let parsedResult: MealParsedResult;
  try {
    parsedResult = JSON.parse(response);
  } catch (error) {
    // Fallback if AI doesn't return valid JSON
    parsedResult = {
      ingredients: [],
      confidence: 0,
    };
  }

  // Cache result
  await cacheResult(text, 'meal', parsedResult);

  return { ...parsedResult, from_cache: false };
}

/**
 * Parse gym workout text using AI
 */
export async function parseGym(text: string): Promise<GymParsedResult> {
  // Check cache first
  const cached = await getCachedResult(text, 'gym');
  if (cached) {
    return { ...cached, from_cache: true };
  }

  // Call AI
  const prompt = `You are a fitness tracking assistant. Parse the following workout description and extract exercise information.

WORKOUT DESCRIPTION:
${text}

KNOWN EQUIPMENT/EXERCISES:
- Bench Press, Incline Bench, Decline Bench
- Squat, Front Squat, Leg Press
- Deadlift, Romanian Deadlift
- Pull-ups, Chin-ups, Lat Pulldown
- Rows (Barbell, Dumbbell, Cable)
- Shoulder Press, Arnold Press, Lateral Raises
- Bicep Curls, Hammer Curls, Preacher Curls
- Tricep Extensions, Dips, Skull Crushers
- Lunges, Leg Curls, Leg Extensions
- Running, Cycling, Rowing (cardio)

Return a JSON object with this exact structure:
{
  "workout_type": "string (optional, e.g., 'strength', 'cardio', 'mixed')",
  "total_duration_minutes": number (optional),
  "exercises": [
    {
      "name": "string (exercise name as written)",
      "matched_equipment": "string (optional, closest match from known equipment)",
      "sets": number (optional),
      "reps": number (optional),
      "weight_lbs": number (optional, convert to lbs if kg mentioned),
      "weight_kg": number (optional),
      "duration_minutes": number (optional, for cardio),
      "notes": "string (optional, any additional info)",
      "confidence": number (0-1, confidence in this exercise parse),
      "needs_clarification": boolean (true if exercise name is ambiguous),
      "clarification_question": "string (optional, question to ask user if ambiguous)"
    }
  ]
}

RULES:
1. Match exercise names to known equipment when possible
2. If exercise name is ambiguous (e.g., "press" could be bench or shoulder), set needs_clarification=true and ask a question
3. Convert units as needed (kg to lbs: multiply by 2.20462)
4. For cardio, focus on duration and distance if mentioned
5. Set confidence based on clarity of description
6. If completely unable to parse, return empty exercises array
7. Return ONLY valid JSON, no additional text

RESPOND WITH JSON ONLY:`;

  const response = await callOpenRouter([
    { role: 'user', content: prompt }
  ]);

  // Parse JSON response
  let parsedResult: GymParsedResult;
  try {
    parsedResult = JSON.parse(response);
  } catch (error) {
    // Fallback if AI doesn't return valid JSON
    parsedResult = {
      exercises: [],
    };
  }

  // Cache result
  await cacheResult(text, 'gym', parsedResult);

  return { ...parsedResult, from_cache: false };
}

/**
 * General-purpose AI parsing for other types
 */
export async function parseGeneral(text: string, instructions?: string): Promise<any> {
  // Check cache first
  const cached = await getCachedResult(text, 'general');
  if (cached) {
    return { ...cached, from_cache: true };
  }

  const prompt = instructions
    ? `${instructions}\n\nINPUT:\n${text}\n\nRESPOND WITH JSON ONLY:`
    : `Parse the following text and extract structured information:\n\n${text}\n\nReturn a JSON object with relevant fields.`;

  const response = await callOpenRouter([
    { role: 'user', content: prompt }
  ]);

  let parsedResult: any;
  try {
    parsedResult = JSON.parse(response);
  } catch (error) {
    parsedResult = { raw_response: response };
  }

  // Cache result
  await cacheResult(text, 'general', parsedResult);

  return { ...parsedResult, from_cache: false };
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  const { data: stats, error } = await supabase
    .from('ai_parse_cache')
    .select('parse_type, access_count, created_at');

  if (error || !stats) {
    return null;
  }

  const byType: Record<string, number> = {};
  let totalHits = 0;
  let totalEntries = stats.length;

  stats.forEach((entry: any) => {
    const type = entry.parse_type;
    byType[type] = (byType[type] || 0) + 1;
    totalHits += entry.access_count;
  });

  return {
    total_entries: totalEntries,
    total_cache_hits: totalHits,
    by_type: byType,
    cache_efficiency: totalEntries > 0 ? ((totalHits / totalEntries) * 100).toFixed(2) + '%' : '0%',
  };
}
