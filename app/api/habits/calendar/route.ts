import { NextRequest, NextResponse } from 'next/server';
import { getHabitCalendar } from '@/lib/habit-utils';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/habits/calendar
 * Get habit completion calendar for a date range or single date
 * Query params:
 *   - habit_id: specific habit (optional)
 *   - date: single date to get all completions (YYYY-MM-DD)
 *   - start_date & end_date: date range for specific habit
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const habitId = searchParams.get('habit_id');
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // If just date provided, return all habit completions for that date
    if (date && !habitId && !startDate && !endDate) {
      try {
        const { data, error } = await supabase
          .from('habit_completions')
          .select('*')
          .eq('completion_date', date);

        if (error) {
          console.error('Error fetching completions for date:', error);
          return NextResponse.json({ completions: [] });
        }

        return NextResponse.json({ completions: data || [] });
      } catch (err) {
        console.error('Error in date-only calendar query:', err);
        return NextResponse.json({ completions: [] });
      }
    }

    // Original behavior for habit-specific calendar
    if (!habitId) {
      return NextResponse.json({ completions: [] });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ completions: [] });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json({ completions: [] });
    }

    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ completions: [] });
    }

    try {
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
        habit_id: habitId,
        start_date: startDate,
        end_date: endDate,
        total_days: allDates.length,
        completed_days: calendar.length,
        completion_rate: allDates.length > 0 ? Math.round((calendar.length / allDates.length) * 100) : 0,
        calendar: allDates,
      });
    } catch (err) {
      console.error('Error fetching habit calendar:', err);
      return NextResponse.json({ completions: [] });
    }
  } catch (error: any) {
    console.error('Error in habits calendar:', error);
    return NextResponse.json({ completions: [] });
  }
}
