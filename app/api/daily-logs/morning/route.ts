import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * PATCH /api/daily-logs/morning
 * Update morning reflection and yesterday's review
 * Body should include: date, yesterday_date, what_went_well, even_better_if,
 * day_rating, gratitude, sleep_start_time, sleep_wake_time, sleep_hours
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      yesterday_date,
      what_went_well,
      even_better_if,
      day_rating,
      gratitude,
      sleep_start_time,
      sleep_wake_time,
      sleep_hours,
    } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'date is required (format: YYYY-MM-DD)', success: false },
        { status: 200 }
      );
    }

    // Validate day_rating if provided
    if (day_rating !== undefined && day_rating !== null) {
      if (day_rating < 1 || day_rating > 10) {
        return NextResponse.json(
          { error: 'day_rating must be between 1 and 10', success: false },
          { status: 200 }
        );
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

    const updateData: any = {};

    // Add all provided fields to update
    if (what_went_well !== undefined) updateData.what_went_well = what_went_well;
    if (even_better_if !== undefined) updateData.even_better_if = even_better_if;
    if (day_rating !== undefined) updateData.day_rating = day_rating;
    if (gratitude !== undefined) updateData.gratitude = gratitude;
    if (sleep_start_time !== undefined) updateData.sleep_start_time = sleep_start_time;
    if (sleep_wake_time !== undefined) updateData.sleep_wake_time = sleep_wake_time;
    if (sleep_hours !== undefined) updateData.sleep_hours = sleep_hours;

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
          { error: 'Failed to update morning reflection', success: false },
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
          { error: 'Failed to create morning reflection', success: false },
          { status: 200 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Morning reflection saved successfully',
    });
  } catch (error: any) {
    console.error('Error updating morning reflection:', error);
    return NextResponse.json(
      { error: 'Failed to update morning reflection', success: false },
      { status: 200 }
    );
  }
}
