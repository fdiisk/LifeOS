import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/nutrition-logs
 * Get nutrition logs, optionally filtered by date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const logDate = searchParams.get('log_date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    let query = supabase.from('nutrition_logs').select('*');

    if (logDate) {
      query = query.eq('log_date', logDate);
    } else if (startDate && endDate) {
      query = query.gte('log_date', startDate).lte('log_date', endDate);
    }

    const { data, error } = await query.order('log_date', { ascending: false });

    if (error) {
      console.error('Supabase error fetching nutrition logs:', error);
      return NextResponse.json({ nutrition_logs: [] }, { status: 200 });
    }

    return NextResponse.json({ nutrition_logs: data || [] });
  } catch (error) {
    console.error('Error fetching nutrition logs:', error);
    return NextResponse.json({ nutrition_logs: [] }, { status: 200 });
  }
}

/**
 * POST /api/nutrition-logs
 * Create a new nutrition log entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      log_date,
      meal_type,
      food_items,
      total_calories,
      protein_grams,
      carbs_grams,
      fats_grams,
      notes,
      ai_parsed_data,
    } = body;

    // Validation
    if (!log_date || !meal_type) {
      return NextResponse.json(
        { error: 'log_date and meal_type are required' },
        { status: 400 }
      );
    }

    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(meal_type)) {
      return NextResponse.json(
        { error: `meal_type must be one of: ${validMealTypes.join(', ')}` },
        { status: 400 }
      );
    }

    try {
      const { data, error } = await supabase
        .from('nutrition_logs')
        .insert({
          log_date,
          meal_type,
          food_items: food_items || {},
          total_calories: total_calories || null,
          protein_grams: protein_grams || null,
          carbs_grams: carbs_grams || null,
          fats_grams: fats_grams || null,
          notes: notes || null,
          ai_parsed_data: ai_parsed_data || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating nutrition log:', error);
        return NextResponse.json(
          { error: 'Failed to save nutrition log', details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { nutrition_log: data, message: 'Nutrition log created successfully' },
        { status: 201 }
      );
    } catch (err) {
      console.error('Error inserting nutrition log:', err);
      return NextResponse.json(
        { error: 'Failed to save nutrition log' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in nutrition logs POST:', error);
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/nutrition-logs?id=<uuid>
 * Delete a nutrition log
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
        .from('nutrition_logs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting nutrition log:', error);
        return NextResponse.json(
          { error: 'Failed to delete nutrition log' },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: 'Nutrition log deleted successfully' });
    } catch (err) {
      console.error('Error deleting nutrition log:', err);
      return NextResponse.json(
        { error: 'Failed to delete nutrition log' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in nutrition logs DELETE:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
