import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getDailyLogSummary } from '@/lib/daily-log-utils';

/**
 * GET /api/daily-logs?date=YYYY-MM-DD
 * Fetch daily log by date with completion statistics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (format: YYYY-MM-DD)' },
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

    const summary = await getDailyLogSummary(date);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error fetching daily log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily log', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daily-logs
 * Create a new daily log entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      log_date,
      task_id,
      habit_id,
      notes,
      mood,
      energy_level,
      ai_parsed_data,
    } = body;

    // Validate required fields
    if (!log_date) {
      return NextResponse.json(
        { error: 'log_date is required' },
        { status: 400 }
      );
    }

    // At least one of task_id, habit_id, or notes must be provided
    if (!task_id && !habit_id && !notes) {
      return NextResponse.json(
        { error: 'At least one of task_id, habit_id, or notes is required' },
        { status: 400 }
      );
    }

    // Validate energy_level range
    if (energy_level !== null && energy_level !== undefined) {
      if (energy_level < 1 || energy_level > 10) {
        return NextResponse.json(
          { error: 'energy_level must be between 1 and 10' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from('daily_logs')
      .insert({
        log_date,
        task_id: task_id || null,
        habit_id: habit_id || null,
        notes: notes || null,
        mood: mood || null,
        energy_level: energy_level || null,
        ai_parsed_data: ai_parsed_data || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create daily log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating daily log:', error);
    return NextResponse.json(
      { error: 'Failed to create daily log', details: error.message },
      { status: 500 }
    );
  }
}
