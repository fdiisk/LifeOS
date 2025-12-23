import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/nutrition-entries
 * Get nutrition entries, optionally filtered by date
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const logDate = searchParams.get('log_date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const mealType = searchParams.get('meal_type');

    let query = supabase.from('nutrition_entries').select('*');

    if (logDate) {
      query = query.eq('log_date', logDate);
    } else if (startDate && endDate) {
      query = query.gte('log_date', startDate).lte('log_date', endDate);
    }

    if (mealType) {
      query = query.eq('meal_type', mealType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching nutrition entries:', error);
      return NextResponse.json({ entries: [] }, { status: 200 });
    }

    return NextResponse.json({ entries: data || [] });
  } catch (error) {
    console.error('Error fetching nutrition entries:', error);
    return NextResponse.json({ entries: [] }, { status: 200 });
  }
}

/**
 * POST /api/nutrition-entries
 * Create nutrition entries (supports batch creation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entries, log_date, meal_type, raw_text, ai_parsed_data } = body;

    // Validation
    if (!log_date || !meal_type) {
      return NextResponse.json(
        { error: 'log_date and meal_type are required', success: false },
        { status: 200 }
      );
    }

    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(meal_type)) {
      return NextResponse.json(
        { error: `meal_type must be one of: ${validMealTypes.join(', ')}`, success: false },
        { status: 200 }
      );
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'entries array is required and must not be empty', success: false },
        { status: 200 }
      );
    }

    try {
      // Prepare entries for insertion
      const entriesToInsert = entries.map((entry) => ({
        log_date,
        meal_type,
        entry_type: entry.type || 'food',
        name: entry.name,
        brand: entry.brand || null,
        serving_size: entry.serving_size || null,
        calories: entry.calories || 0,
        protein_g: entry.protein_g || 0,
        carbs_g: entry.carbs_g || 0,
        fat_g: entry.fat_g || 0,
        raw_text: raw_text || null,
        ai_parsed_data: ai_parsed_data || null,
        final_confirmed_data: entry,
      }));

      const { data, error } = await supabase
        .from('nutrition_entries')
        .insert(entriesToInsert)
        .select();

      if (error) {
        console.error('Supabase error creating nutrition entries:', error);
        return NextResponse.json(
          {
            error: 'Database unavailable. Please configure Supabase credentials.',
            success: false,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          entries: data,
          message: `${data.length} nutrition ${data.length === 1 ? 'entry' : 'entries'} created successfully`,
          success: true,
        },
        { status: 200 }
      );
    } catch (err) {
      console.error('Error inserting nutrition entries:', err);
      return NextResponse.json(
        { error: 'Failed to save nutrition entries. Database may be unavailable.', success: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in nutrition entries POST:', error);
    return NextResponse.json(
      { error: 'Invalid request data', success: false },
      { status: 200 }
    );
  }
}

/**
 * PATCH /api/nutrition-entries?id=<uuid>
 * Update a single nutrition entry
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
    const { name, calories, protein_g, carbs_g, fat_g, serving_size, brand } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (calories !== undefined) updates.calories = calories;
    if (protein_g !== undefined) updates.protein_g = protein_g;
    if (carbs_g !== undefined) updates.carbs_g = carbs_g;
    if (fat_g !== undefined) updates.fat_g = fat_g;
    if (serving_size !== undefined) updates.serving_size = serving_size;
    if (brand !== undefined) updates.brand = brand;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', success: false },
        { status: 200 }
      );
    }

    try {
      const { data, error } = await supabase
        .from('nutrition_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating nutrition entry:', error);
        return NextResponse.json(
          { error: 'Failed to update nutrition entry', success: false },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { entry: data, message: 'Nutrition entry updated successfully', success: true },
        { status: 200 }
      );
    } catch (err) {
      console.error('Error updating nutrition entry:', err);
      return NextResponse.json(
        { error: 'Failed to update nutrition entry', success: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in nutrition entries PATCH:', error);
    return NextResponse.json(
      { error: 'Invalid request data', success: false },
      { status: 200 }
    );
  }
}

/**
 * DELETE /api/nutrition-entries?id=<uuid>
 * Delete a nutrition entry
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
      const { error } = await supabase.from('nutrition_entries').delete().eq('id', id);

      if (error) {
        console.error('Supabase error deleting nutrition entry:', error);
        return NextResponse.json(
          { error: 'Failed to delete nutrition entry', success: false },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { message: 'Nutrition entry deleted successfully', success: true },
        { status: 200 }
      );
    } catch (err) {
      console.error('Error deleting nutrition entry:', err);
      return NextResponse.json(
        { error: 'Failed to delete nutrition entry', success: false },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error in nutrition entries DELETE:', error);
    return NextResponse.json(
      { error: 'Invalid request', success: false },
      { status: 200 }
    );
  }
}
