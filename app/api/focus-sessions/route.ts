import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/focus-sessions
 * Get focus sessions, optionally filtered by date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase.from('focus_sessions').select('*');

    if (startDate && endDate) {
      query = query.gte('start_time', startDate).lte('start_time', endDate);
    }

    const { data, error } = await query.order('start_time', { ascending: false });

    if (error) {
      console.error('Supabase error fetching focus sessions:', error);
      return NextResponse.json({ sessions: [] }, { status: 200 });
    }

    return NextResponse.json({ sessions: data || [] });
  } catch (error) {
    console.error('Error fetching focus sessions:', error);
    return NextResponse.json({ sessions: [] }, { status: 200 });
  }
}

/**
 * POST /api/focus-sessions
 * Create a new focus session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      task_id,
      start_time,
      end_time,
      duration_minutes,
      notes,
      was_successful,
      ai_parsed_data,
    } = body;

    // Validation
    if (!start_time) {
      return NextResponse.json(
        { error: 'start_time is required' },
        { status: 400 }
      );
    }

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          task_id: task_id || null,
          start_time,
          end_time: end_time || null,
          duration_minutes: duration_minutes || null,
          notes: notes || null,
          was_successful: was_successful || null,
          ai_parsed_data: ai_parsed_data || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating focus session:', error);
        return NextResponse.json(
          { error: 'Failed to save focus session', details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { session: data, message: 'Focus session created successfully' },
        { status: 201 }
      );
    } catch (err) {
      console.error('Error inserting focus session:', err);
      return NextResponse.json(
        { error: 'Failed to save focus session' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in focus sessions POST:', error);
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/focus-sessions?id=<uuid>
 * Delete a focus session
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
        .from('focus_sessions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting focus session:', error);
        return NextResponse.json(
          { error: 'Failed to delete focus session' },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: 'Focus session deleted successfully' });
    } catch (err) {
      console.error('Error deleting focus session:', err);
      return NextResponse.json(
        { error: 'Failed to delete focus session' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in focus sessions DELETE:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
