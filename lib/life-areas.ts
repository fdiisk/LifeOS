/**
 * Life Area Categories
 *
 * Defines the standardized life area categories used throughout the application.
 */

export const LIFE_AREAS = [
  'financial',
  'personal',
  'relationships',
  'recreation',
  'career',
  'hobbies',
  'health',
] as const;

export type LifeArea = typeof LIFE_AREAS[number];

/**
 * Migration mapping from old categories to new
 */
export const LIFE_AREA_MIGRATION_MAP: Record<string, LifeArea> = {
  // Old capitalized versions
  'Financial': 'financial',
  'Health': 'health',
  'Personal': 'personal',
  'Professional': 'career',
  'Relationships': 'relationships',
  // Lowercase versions (already correct or need mapping)
  'financial': 'financial',
  'health': 'health',
  'personal': 'personal',
  'professional': 'career',
  'relationships': 'relationships',
  'recreation': 'recreation',
  'career': 'career',
  'hobbies': 'hobbies',
};

/**
 * Display names for life areas
 */
export const LIFE_AREA_LABELS: Record<LifeArea, string> = {
  financial: 'Financial',
  personal: 'Personal',
  relationships: 'Relationships',
  recreation: 'Recreation',
  career: 'Career',
  hobbies: 'Hobbies',
  health: 'Health',
};

/**
 * Color scheme for life areas (for charts and UI)
 */
export const LIFE_AREA_COLORS: Record<LifeArea, { stroke: string; fill: string }> = {
  health: {
    stroke: '#10b981', // green-500
    fill: '#10b981',
  },
  career: {
    stroke: '#3b82f6', // blue-500
    fill: '#3b82f6',
  },
  personal: {
    stroke: '#f59e0b', // amber-500
    fill: '#f59e0b',
  },
  relationships: {
    stroke: '#ec4899', // pink-500
    fill: '#ec4899',
  },
  financial: {
    stroke: '#8b5cf6', // violet-500
    fill: '#8b5cf6',
  },
  recreation: {
    stroke: '#06b6d4', // cyan-500
    fill: '#06b6d4',
  },
  hobbies: {
    stroke: '#f97316', // orange-500
    fill: '#f97316',
  },
};

/**
 * Normalize a life area value to the standard format
 */
export function normalizeLifeArea(value: string | undefined | null): LifeArea {
  if (!value) return 'personal'; // default

  const normalized = LIFE_AREA_MIGRATION_MAP[value];
  if (normalized) return normalized;

  // If not found in migration map, try lowercase match
  const lowerValue = value.toLowerCase() as LifeArea;
  if (LIFE_AREAS.includes(lowerValue)) {
    return lowerValue;
  }

  // Default fallback
  return 'personal';
}

/**
 * Validate if a value is a valid life area
 */
export function isValidLifeArea(value: string): value is LifeArea {
  return LIFE_AREAS.includes(value as LifeArea);
}
