import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/cardio-entries
 * Get cardio entries, optionally filtered by date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const logDate = searchParams.get('log_date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase.from('cardio_entries').select('*');

    if (logDate) {
      query = query.eq('log_date', logDate);
    } else if (startDate && endDate) {
      query = query.gte('log_date', startDate).lte('log_date', endDate);
    }

    const { data, error } = await query.order('log_date', { ascending: false });

    if (error) {
      console.error('Supabase error fetching cardio entries:', error);
      return NextResponse.json({ cardio_entries: [] }, { status: 200 });
    }

    return NextResponse.json({ cardio_entries: data || [] });
  } catch (error) {
    console.error('Error fetching cardio entries:', error);
    return NextResponse.json({ cardio_entries: [] }, { status: 200 });
  }
}

/**
 * POST /api/cardio-entries
 * Create a new cardio entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      log_date,
      entry_type,
      duration_minutes,
      distance_km,
      steps,
      calories_burned,
      avg_heart_rate,
      raw_text,
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

    if (!entry_type) {
      return NextResponse.json(
        { error: 'entry_type is required' },
        { status: 400 }
      );
    }

    try {
      const { data, error } = await supabase
        .from('cardio_entries')
        .insert({
          log_date,
          entry_type,
          duration_minutes: duration_minutes || null,
          distance_km: distance_km || null,
          steps: steps || null,
          calories_burned: calories_burned || null,
          avg_heart_rate: avg_heart_rate || null,
          raw_text: raw_text || null,
          notes: notes || null,
          ai_parsed_data: ai_parsed_data || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating cardio entry:', error);
        return NextResponse.json(
          { error: 'Failed to save cardio entry', details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { cardio_entry: data, message: 'Cardio entry created successfully' },
        { status: 201 }
      );
    } catch (err) {
      console.error('Error inserting cardio entry:', err);
      return NextResponse.json(
        { error: 'Failed to save cardio entry' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in cardio entries POST:', error);
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
}

/**
 * PATCH /api/cardio-entries?id=<uuid>
 * Update an existing cardio entry
 */
export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id parameter is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      log_date,
      entry_type,
      duration_minutes,
      distance_km,
      steps,
      calories_burned,
      avg_heart_rate,
      raw_text,
      notes,
      ai_parsed_data,
    } = body;

    const updateData: any = {};
    if (log_date !== undefined) updateData.log_date = log_date;
    if (entry_type !== undefined) updateData.entry_type = entry_type;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (distance_km !== undefined) updateData.distance_km = distance_km;
    if (steps !== undefined) updateData.steps = steps;
    if (calories_burned !== undefined) updateData.calories_burned = calories_burned;
    if (avg_heart_rate !== undefined) updateData.avg_heart_rate = avg_heart_rate;
    if (raw_text !== undefined) updateData.raw_text = raw_text;
    if (notes !== undefined) updateData.notes = notes;
    if (ai_parsed_data !== undefined) updateData.ai_parsed_data = ai_parsed_data;

    const { data, error } = await supabase
      .from('cardio_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating cardio entry:', error);
      return NextResponse.json(
        { error: 'Failed to update cardio entry', success: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Cardio entry updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating cardio entry:', error);
    return NextResponse.json(
      { error: 'Failed to update cardio entry', success: false },
      { status: 200 }
    );
  }
}

/**
 * DELETE /api/cardio-entries?id=<uuid>
 * Delete a cardio entry
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
        .from('cardio_entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting cardio entry:', error);
        return NextResponse.json(
          { error: 'Failed to delete cardio entry' },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: 'Cardio entry deleted successfully' });
    } catch (err) {
      console.error('Error deleting cardio entry:', err);
      return NextResponse.json(
        { error: 'Failed to delete cardio entry' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in cardio entries DELETE:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
