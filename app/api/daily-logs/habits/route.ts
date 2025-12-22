import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/daily-logs/habits?date=YYYY-MM-DD
 * Attach completed habits to a daily log
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { habit_ids, notes } = body;

    if (!habit_ids || !Array.isArray(habit_ids) || habit_ids.length === 0) {
      return NextResponse.json(
        { error: 'habit_ids array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate that all habits exist
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('id, name, is_active')
      .in('id', habit_ids);

    if (habitsError) {
      console.error('Error fetching habits:', habitsError);
      return NextResponse.json(
        { error: 'Failed to validate habits', details: habitsError.message },
        { status: 500 }
      );
    }

    if (!habitsData || habitsData.length !== habit_ids.length) {
      return NextResponse.json(
        { error: 'One or more habit IDs are invalid' },
        { status: 400 }
      );
    }

    // Check for inactive habits
    const inactiveHabits = habitsData.filter((habit: any) => !habit.is_active);
    if (inactiveHabits.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot log inactive habits',
          inactive_habits: inactiveHabits.map((h: any) => ({ id: h.id, name: h.name })),
        },
        { status: 400 }
      );
    }

    // Check if any habits are already logged for this date
    const { data: existingLogs, error: existingError } = await supabase
      .from('daily_logs')
      .select('habit_id')
      .eq('log_date', date)
      .in('habit_id', habit_ids);

    if (existingError) {
      console.error('Error checking existing logs:', existingError);
      return NextResponse.json(
        { error: 'Failed to check existing logs', details: existingError.message },
        { status: 500 }
      );
    }

    const alreadyLoggedIds = new Set(
      existingLogs?.map((log: any) => log.habit_id) || []
    );

    const habitsToLog = habit_ids.filter((id) => !alreadyLoggedIds.has(id));

    if (habitsToLog.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All habits already logged for this date',
        data: {
          logs_created: 0,
          already_logged: habit_ids.length,
        },
      });
    }

    // Create daily log entries for each habit
    const logEntries = habitsToLog.map((habit_id) => ({
      log_date: date,
      habit_id,
      notes: notes || null,
    }));

    const { data, error } = await supabase
      .from('daily_logs')
      .insert(logEntries)
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to attach habits to daily log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        logs_created: data.length,
        already_logged: alreadyLoggedIds.size,
        logs: data,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error attaching habits to daily log:', error);
    return NextResponse.json(
      { error: 'Failed to attach habits to daily log', details: error.message },
      { status: 500 }
    );
  }
}
