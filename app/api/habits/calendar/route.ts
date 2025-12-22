import { NextRequest, NextResponse } from 'next/server';
import { getHabitCalendar } from '@/lib/habit-utils';

/**
 * GET /api/habits/calendar?habit_id=<uuid>&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * Get habit completion calendar for a date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const habitId = searchParams.get('habit_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!habitId) {
      return NextResponse.json(
        { error: 'habit_id parameter is required' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date parameters are required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'start_date must be before or equal to end_date' },
        { status: 400 }
      );
    }

    const calendar = await getHabitCalendar(habitId, startDate, endDate);

    // Create a map of completed dates
    const completedDates = new Set(calendar.map((entry: any) => entry.log_date));

    // Generate all dates in range
    const allDates: any[] = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    while (currentDate <= lastDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const completionEntry = calendar.find((entry: any) => entry.log_date === dateStr);

      allDates.push({
        date: dateStr,
        completed: completedDates.has(dateStr),
        notes: completionEntry?.notes || null,
        mood: completionEntry?.mood || null,
        energy_level: completionEntry?.energy_level || null,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        habit_id: habitId,
        start_date: startDate,
        end_date: endDate,
        total_days: allDates.length,
        completed_days: calendar.length,
        completion_rate: Math.round((calendar.length / allDates.length) * 100),
        calendar: allDates,
      },
    });
  } catch (error: any) {
    console.error('Error fetching habit calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit calendar', details: error.message },
      { status: 500 }
    );
  }
}
