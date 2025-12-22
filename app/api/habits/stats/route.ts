import { NextRequest, NextResponse } from 'next/server';
import { getHabitStats, getAllHabitsWithStats } from '@/lib/habit-utils';

/**
 * GET /api/habits/stats?habit_id=<uuid>
 * Get comprehensive statistics for a specific habit or all habits
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const habitId = searchParams.get('habit_id');
    const isActive = searchParams.get('is_active');
    const frequency = searchParams.get('frequency');

    // Get stats for a specific habit
    if (habitId) {
      const stats = await getHabitStats(habitId);

      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    // Get stats for all habits
    const filters: any = {};
    if (isActive !== null) {
      filters.is_active = isActive === 'true';
    }
    if (frequency) {
      filters.frequency = frequency;
    }

    const habitsWithStats = await getAllHabitsWithStats(filters);

    return NextResponse.json({
      success: true,
      data: habitsWithStats,
      count: habitsWithStats.length,
    });
  } catch (error: any) {
    console.error('Error fetching habit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit stats', details: error.message },
      { status: 500 }
    );
  }
}
