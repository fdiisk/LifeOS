import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isHabitCompletedOnDate, getHabitStats } from '@/lib/habit-utils';

/**
 * POST /api/habits/complete?habit_id=<uuid>&date=YYYY-MM-DD
 * Mark a habit as completed for a specific date
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const habitId = searchParams.get('habit_id');
    const date = searchParams.get('date');

    if (!habitId) {
      return NextResponse.json(
        { error: 'habit_id parameter is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'date parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Verify habit exists and is active
    const { data: habit, error: habitError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .single();

    if (habitError || !habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    if (!habit.is_active) {
      return NextResponse.json(
        { error: 'Cannot complete an inactive habit' },
        { status: 400 }
      );
    }

    // Check if already completed on this date
    const alreadyCompleted = await isHabitCompletedOnDate(habitId, date);

    if (alreadyCompleted) {
      return NextResponse.json(
        {
          success: true,
          message: 'Habit already completed on this date',
          already_completed: true,
        }
      );
    }

    // Parse request body for optional fields
    const body = await request.json().catch(() => ({}));
    const { notes, mood, energy_level } = body;

    // Create daily log entry
    const { data: dailyLog, error: logError } = await supabase
      .from('daily_logs')
      .insert({
        log_date: date,
        habit_id: habitId,
        notes: notes || null,
        mood: mood || null,
        energy_level: energy_level || null,
      })
      .select()
      .single();

    if (logError) {
      console.error('Supabase error:', logError);
      return NextResponse.json(
        { error: 'Failed to complete habit', details: logError.message },
        { status: 500 }
      );
    }

    // Get updated stats
    const stats = await getHabitStats(habitId);

    return NextResponse.json({
      success: true,
      message: 'Habit completed successfully',
      data: {
        daily_log: dailyLog,
        habit: {
          id: habit.id,
          name: habit.name,
        },
        stats,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error completing habit:', error);
    return NextResponse.json(
      { error: 'Failed to complete habit', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/habits/complete?habit_id=<uuid>&date=YYYY-MM-DD
 * Remove habit completion for a specific date (undo)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const habitId = searchParams.get('habit_id');
    const date = searchParams.get('date');

    if (!habitId) {
      return NextResponse.json(
        { error: 'habit_id parameter is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'date parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Delete the daily log entry for this habit and date
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('habit_id', habitId)
      .eq('log_date', date);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to remove habit completion', details: error.message },
        { status: 500 }
      );
    }

    // Get updated stats
    const stats = await getHabitStats(habitId);

    return NextResponse.json({
      success: true,
      message: 'Habit completion removed',
      data: {
        stats,
      },
    });
  } catch (error: any) {
    console.error('Error removing habit completion:', error);
    return NextResponse.json(
      { error: 'Failed to remove habit completion', details: error.message },
      { status: 500 }
    );
  }
}
