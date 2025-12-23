import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { normalizeLifeArea } from '@/lib/life-areas';

const MAX_DAILY_HOURS = 14;
const MAX_DAILY_MINUTES = MAX_DAILY_HOURS * 60;

/**
 * GET /api/focus-sessions
 * Get focus sessions (time blocks), optionally filtered by date range or specific date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const blockDate = searchParams.get('block_date');
    const lifeArea = searchParams.get('life_area');

    let query = supabase.from('focus_sessions').select('*');

    if (blockDate) {
      query = query.eq('block_date', blockDate);
    } else if (startDate && endDate) {
      query = query.gte('block_date', startDate).lte('block_date', endDate);
    }

    if (lifeArea) {
      query = query.eq('life_area', lifeArea);
    }

    const { data, error} = await query.order('start_time', { ascending: false });

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
 * Create a new time block / focus session
 *
 * Enforces maximum of 14 allocatable hours per day
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      task_id,
      macro_goal_id,
      start_time,
      end_time,
      duration_minutes,
      block_date,
      life_area,
      focus_rating,
      success_rating,
      notes,
      was_successful,
      ai_parsed_data,
    } = body;

    // Validation
    if (!start_time) {
      return NextResponse.json(
        { error: 'start_time is required', success: false },
        { status: 200 }
      );
    }

    if (!duration_minutes || duration_minutes <= 0) {
      return NextResponse.json(
        { error: 'duration_minutes must be a positive number', success: false },
        { status: 200 }
      );
    }

    // Validate ratings if provided
    if (focus_rating !== undefined && focus_rating !== null) {
      if (focus_rating < 1 || focus_rating > 10) {
        return NextResponse.json(
          { error: 'focus_rating must be between 1 and 10', success: false },
          { status: 200 }
        );
      }
    }

    if (success_rating !== undefined && success_rating !== null) {
      if (success_rating < 1 || success_rating > 10) {
        return NextResponse.json(
          { error: 'success_rating must be between 1 and 10', success: false },
          { status: 200 }
        );
      }
    }

    // Determine block_date from start_time if not provided
    const finalBlockDate = block_date || new Date(start_time).toISOString().split('T')[0];

    // Check daily limit: 14 hours (840 minutes) per day
    try {
      const { data: existingSessions, error: fetchError } = await supabase
        .from('focus_sessions')
        .select('duration_minutes')
        .eq('block_date', finalBlockDate);

      if (fetchError) {
        console.error('Error checking daily limit:', fetchError);
        // Allow creation even if check fails
      } else if (existingSessions) {
        const totalMinutes = existingSessions.reduce(
          (sum, session) => sum + (session.duration_minutes || 0),
          0
        );

        if (totalMinutes + duration_minutes > MAX_DAILY_MINUTES) {
          const remainingMinutes = MAX_DAILY_MINUTES - totalMinutes;
          const remainingHours = Math.floor(remainingMinutes / 60);
          const remainingMins = remainingMinutes % 60;

          return NextResponse.json(
            {
              error: `Daily time blocking limit exceeded. You have ${remainingHours}h ${remainingMins}m remaining out of ${MAX_DAILY_HOURS}h total for ${finalBlockDate}.`,
              daily_limit: MAX_DAILY_HOURS,
              allocated_hours: (totalMinutes / 60).toFixed(2),
              remaining_minutes: remainingMinutes,
              success: false,
            },
            { status: 200 }
          );
        }
      }
    } catch (err) {
      console.error('Error validating daily limit:', err);
      // Continue with creation if validation fails
    }

    // Normalize life_area if provided
    const normalizedLifeArea = life_area ? normalizeLifeArea(life_area) : null;

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          task_id: task_id || null,
          macro_goal_id: macro_goal_id || null,
          start_time,
          end_time: end_time || null,
          duration_minutes: duration_minutes || null,
          block_date: finalBlockDate,
          life_area: normalizedLifeArea,
          focus_rating: focus_rating || null,
          success_rating: success_rating || null,
          notes: notes || null,
          was_successful: was_successful || null,
          ai_parsed_data: ai_parsed_data || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating focus session:', error);
        return NextResponse.json(
          { error: 'Database unavailable. Please configure Supabase credentials.', success: false },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { session: data, message: 'Time block created successfully', success: true },
        { status: 200 }
      );
    } catch (err) {
      console.error('Error inserting focus session:', err);
      return NextResponse.json(
        { error: 'Failed to save time block', success: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in focus sessions POST:', error);
    return NextResponse.json(
      { error: 'Invalid request data', success: false },
      { status: 200 }
    );
  }
}

/**
 * PATCH /api/focus-sessions?id=<uuid>
 * Update an existing time block
 */
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id parameter is required', success: false },
        { status: 200 }
      );
    }

    const body = await request.json();
    const {
      duration_minutes,
      life_area,
      focus_rating,
      success_rating,
      notes,
      end_time,
    } = body;

    // Validate ratings if provided
    if (focus_rating !== undefined && focus_rating !== null) {
      if (focus_rating < 1 || focus_rating > 10) {
        return NextResponse.json(
          { error: 'focus_rating must be between 1 and 10', success: false },
          { status: 200 }
        );
      }
    }

    if (success_rating !== undefined && success_rating !== null) {
      if (success_rating < 1 || success_rating > 10) {
        return NextResponse.json(
          { error: 'success_rating must be between 1 and 10', success: false },
          { status: 200 }
        );
      }
    }

    // Build update object
    const updates: any = {};
    if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
    if (life_area !== undefined) updates.life_area = normalizeLifeArea(life_area);
    if (focus_rating !== undefined) updates.focus_rating = focus_rating;
    if (success_rating !== undefined) updates.success_rating = success_rating;
    if (notes !== undefined) updates.notes = notes;
    if (end_time !== undefined) updates.end_time = end_time;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', success: false },
        { status: 200 }
      );
    }

    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating focus session:', error);
        return NextResponse.json(
          { error: 'Failed to update time block', success: false },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { session: data, message: 'Time block updated successfully', success: true },
        { status: 200 }
      );
    } catch (err) {
      console.error('Error updating focus session:', err);
      return NextResponse.json(
        { error: 'Failed to update time block', success: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in focus sessions PATCH:', error);
    return NextResponse.json(
      { error: 'Invalid request data', success: false },
      { status: 200 }
    );
  }
}

/**
 * DELETE /api/focus-sessions?id=<uuid>
 * Delete a time block
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id parameter is required', success: false },
        { status: 200 }
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
          { error: 'Failed to delete time block', success: false },
          { status: 200 }
        );
      }

      return NextResponse.json({ message: 'Time block deleted successfully', success: true });
    } catch (err) {
      console.error('Error deleting focus session:', err);
      return NextResponse.json(
        { error: 'Failed to delete time block', success: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in focus sessions DELETE:', error);
    return NextResponse.json(
      { error: 'Invalid request', success: false },
      { status: 200 }
    );
  }
}
