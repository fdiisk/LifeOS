import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * PATCH /api/daily-logs/evening
 * Update evening reflection and ratings
 * Body should include: date, evening_focus_rating, evening_effort_rating,
 * evening_mood_rating, evening_success_rating, evening_journal, day_locked, locked_at
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      evening_focus_rating,
      evening_effort_rating,
      evening_mood_rating,
      evening_success_rating,
      evening_journal,
      day_locked,
      locked_at,
    } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'date is required (format: YYYY-MM-DD)', success: false },
        { status: 200 }
      );
    }

    // Validate ratings if provided
    const ratings = [
      { name: 'evening_focus_rating', value: evening_focus_rating },
      { name: 'evening_effort_rating', value: evening_effort_rating },
      { name: 'evening_mood_rating', value: evening_mood_rating },
      { name: 'evening_success_rating', value: evening_success_rating },
    ];

    for (const rating of ratings) {
      if (rating.value !== undefined && rating.value !== null) {
        if (rating.value < 1 || rating.value > 10) {
          return NextResponse.json(
            { error: `${rating.name} must be between 1 and 10`, success: false },
            { status: 200 }
          );
        }
      }
    }

    // Check if a daily_logs record already exists for this date
    const { data: existingLog, error: fetchError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('log_date', date)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing log:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch existing log', success: false },
        { status: 200 }
      );
    }

    // Check if day is already locked
    if (existingLog?.day_locked) {
      return NextResponse.json(
        { error: 'This day is locked and cannot be modified', success: false },
        { status: 200 }
      );
    }

    const updateData: any = {};

    // Add all provided fields to update
    if (evening_focus_rating !== undefined) updateData.evening_focus_rating = evening_focus_rating;
    if (evening_effort_rating !== undefined)
      updateData.evening_effort_rating = evening_effort_rating;
    if (evening_mood_rating !== undefined) updateData.evening_mood_rating = evening_mood_rating;
    if (evening_success_rating !== undefined)
      updateData.evening_success_rating = evening_success_rating;
    if (evening_journal !== undefined) updateData.evening_journal = evening_journal;
    if (day_locked !== undefined) updateData.day_locked = day_locked;
    if (locked_at !== undefined) updateData.locked_at = locked_at;

    let result;
    if (existingLog) {
      // Update existing daily log
      const { data, error } = await supabase
        .from('daily_logs')
        .update(updateData)
        .eq('id', existingLog.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json(
          { error: 'Failed to update evening reflection', success: false },
          { status: 200 }
        );
      }

      result = data;
    } else {
      // Create new daily log entry
      const { data, error } = await supabase
        .from('daily_logs')
        .insert({
          log_date: date,
          ...updateData,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json(
          { error: 'Failed to create evening reflection', success: false },
          { status: 200 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Evening reflection saved successfully',
    });
  } catch (error: any) {
    console.error('Error updating evening reflection:', error);
    return NextResponse.json(
      { error: 'Failed to update evening reflection', success: false },
      { status: 200 }
    );
  }
}
