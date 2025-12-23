import { createHash } from 'crypto';
import { supabase } from './supabase';
import { callOpenRouter } from './openrouter';

export type ParseType = 'meal' | 'gym' | 'general';

export interface NutritionEntry {
  name: string;
  type: 'food' | 'water' | 'caffeine';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  timestamp: string;
  serving_size?: string;
  brand?: string;
}

export interface MealParsedResult {
  entries: NutritionEntry[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  raw_input: string;
  confidence: number;
  from_cache?: boolean;
  error?: string;
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
  const prompt = `You are a nutrition parsing assistant. Parse the following meal description and extract individual food items with their nutritional information.

MEAL DESCRIPTION:
${text}

Return a JSON object with this exact structure:
{
  "entries": [
    {
      "name": "string (use brand + product when identifiable, e.g., 'Chobani Greek Yogurt' not just 'yogurt')",
      "type": "food" (always use "food" for consumables, use "water" or "caffeine" if explicitly mentioned),
      "calories": number (estimated calories for this item),
      "protein_g": number (protein in grams),
      "carbs_g": number (carbohydrates in grams),
      "fat_g": number (fats in grams),
      "serving_size": "string (optional, e.g., '1 cup', '200g', '1 medium apple')",
      "brand": "string (optional, brand name if identifiable)"
    }
  ],
  "confidence": number (0-1, your confidence in the parsing)
}

CRITICAL RULES:
1. ALWAYS return an array of entries - one entry per distinct food item
2. Each entry MUST have complete macro information (calories, protein_g, carbs_g, fat_g)
3. Use brand names when identifiable (e.g., "Starbucks Latte" not just "latte")
4. Be specific with names (e.g., "Grilled Chicken Breast" not just "chicken")
5. If serving size is mentioned or can be inferred, include it
6. NEVER return zero macros if you can estimate them from standard nutritional data
7. For common foods, use USDA nutritional database standards
8. If completely unable to parse, return empty entries array with confidence 0
9. Return ONLY valid JSON, no additional text

EXAMPLES:
Input: "2 eggs and toast with butter"
Output: {
  "entries": [
    {
      "name": "Large Eggs",
      "type": "food",
      "calories": 140,
      "protein_g": 12,
      "carbs_g": 1,
      "fat_g": 10,
      "serving_size": "2 large eggs"
    },
    {
      "name": "White Bread Toast",
      "type": "food",
      "calories": 160,
      "protein_g": 5,
      "carbs_g": 30,
      "fat_g": 2,
      "serving_size": "2 slices"
    },
    {
      "name": "Butter",
      "type": "food",
      "calories": 100,
      "protein_g": 0,
      "carbs_g": 0,
      "fat_g": 11,
      "serving_size": "1 tbsp"
    }
  ],
  "confidence": 0.9
}

RESPOND WITH JSON ONLY:`;

  const response = await callOpenRouter([
    { role: 'user', content: prompt }
  ]);

  // Parse JSON response
  let aiResult: any;
  try {
    aiResult = JSON.parse(response);
  } catch (error) {
    // Fallback if AI doesn't return valid JSON
    return {
      entries: [],
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
      raw_input: text,
      confidence: 0,
      from_cache: false,
      error: 'Failed to parse AI response',
    };
  }

  // Ensure entries exist and have timestamps
  const entries: NutritionEntry[] = (aiResult.entries || []).map((entry: any) => ({
    name: entry.name || 'Unknown Item',
    type: entry.type || 'food',
    calories: entry.calories || 0,
    protein_g: entry.protein_g || 0,
    carbs_g: entry.carbs_g || 0,
    fat_g: entry.fat_g || 0,
    timestamp: new Date().toISOString(),
    serving_size: entry.serving_size,
    brand: entry.brand,
  }));

  // Calculate totals from entries
  const totals = entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein_g: acc.protein_g + entry.protein_g,
      carbs_g: acc.carbs_g + entry.carbs_g,
      fat_g: acc.fat_g + entry.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  const parsedResult: MealParsedResult = {
    entries,
    total_calories: totals.calories,
    total_protein_g: totals.protein_g,
    total_carbs_g: totals.carbs_g,
    total_fat_g: totals.fat_g,
    raw_input: text,
    confidence: aiResult.confidence || 0,
    from_cache: false,
  };

  // Cache result
  await cacheResult(text, 'meal', parsedResult);

  return parsedResult;
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
