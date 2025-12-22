import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * PATCH /api/daily-logs/evening?date=YYYY-MM-DD
 * Update evening journal for a specific date
 */
export async function PATCH(request: NextRequest) {
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
    const { journal, mood, energy_level } = body;

    if (!journal) {
      return NextResponse.json(
        { error: 'journal text is required' },
        { status: 400 }
      );
    }

    // Check if an evening journal entry already exists for this date
    const { data: existingLog, error: fetchError } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('log_date', date)
      .ilike('notes', '[EVENING]%')
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching existing log:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch existing log', details: fetchError.message },
        { status: 500 }
      );
    }

    const eveningNotes = `[EVENING] ${journal}`;

    let result;
    if (existingLog) {
      // Update existing evening journal
      const { data, error } = await supabase
        .from('daily_logs')
        .update({
          notes: eveningNotes,
          mood: mood || existingLog.mood,
          energy_level: energy_level || existingLog.energy_level,
        })
        .eq('id', existingLog.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json(
          { error: 'Failed to update evening journal', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Create new evening journal entry
      const { data, error } = await supabase
        .from('daily_logs')
        .insert({
          log_date: date,
          notes: eveningNotes,
          mood: mood || null,
          energy_level: energy_level || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json(
          { error: 'Failed to create evening journal', details: error.message },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error updating evening journal:', error);
    return NextResponse.json(
      { error: 'Failed to update evening journal', details: error.message },
      { status: 500 }
    );
  }
}
