import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/gym-logs
 * Get gym logs, optionally filtered by date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const logDate = searchParams.get('log_date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase.from('gym_logs').select('*');

    if (logDate) {
      query = query.eq('log_date', logDate);
    } else if (startDate && endDate) {
      query = query.gte('log_date', startDate).lte('log_date', endDate);
    }

    const { data, error } = await query.order('log_date', { ascending: false });

    if (error) {
      console.error('Supabase error fetching gym logs:', error);
      return NextResponse.json({ gym_logs: [] }, { status: 200 });
    }

    return NextResponse.json({ gym_logs: data || [] });
  } catch (error) {
    console.error('Error fetching gym logs:', error);
    return NextResponse.json({ gym_logs: [] }, { status: 200 });
  }
}

/**
 * POST /api/gym-logs
 * Create a new gym log entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      log_date,
      workout_type,
      exercises,
      duration_minutes,
      notes,
      ai_parsed_data,
    } = body;

    // Validation
    if (!log_date) {
      return NextResponse.json(
        { error: 'log_date is required' },
        { status: 400 }
      );
    }

    try {
      const { data, error } = await supabase
        .from('gym_logs')
        .insert({
          log_date,
          workout_type: workout_type || 'General',
          exercises: exercises || {},
          duration_minutes: duration_minutes || null,
          notes: notes || null,
          ai_parsed_data: ai_parsed_data || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating gym log:', error);
        return NextResponse.json(
          { error: 'Failed to save gym log', details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { gym_log: data, message: 'Gym log created successfully' },
        { status: 201 }
      );
    } catch (err) {
      console.error('Error inserting gym log:', err);
      return NextResponse.json(
        { error: 'Failed to save gym log' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in gym logs POST:', error);
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/gym-logs?id=<uuid>
 * Delete a gym log
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    try {
      const { error } = await supabase
        .from('gym_logs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting gym log:', error);
        return NextResponse.json(
          { error: 'Failed to delete gym log' },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: 'Gym log deleted successfully' });
    } catch (err) {
      console.error('Error deleting gym log:', err);
      return NextResponse.json(
        { error: 'Failed to delete gym log' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in gym logs DELETE:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
