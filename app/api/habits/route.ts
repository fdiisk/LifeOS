import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAllHabitsWithStats } from '@/lib/habit-utils';

/**
 * GET /api/habits
 * Get all habits, optionally with stats and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const isActive = searchParams.get('is_active');
    const frequency = searchParams.get('frequency');
    const includeStats = searchParams.get('include_stats') === 'true';

    // Get single habit by ID
    if (id) {
      const { data: habit, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !habit) {
        return NextResponse.json(
          { error: 'Habit not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: habit,
      });
    }

    // Get all habits with stats
    if (includeStats) {
      const filters: any = {};
      if (isActive !== null) {
        filters.is_active = isActive === 'true';
      }
      if (frequency) {
        filters.frequency = frequency;
      }

      const habitsWithStats = await getAllHabitsWithStats(filters);

      return NextResponse.json({
        success: true,
        data: habitsWithStats,
        count: habitsWithStats.length,
      });
    }

    // Get all habits without stats
    let query = supabase.from('habits').select('*').order('created_at', { ascending: false });

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }
    if (frequency) {
      query = query.eq('frequency', frequency);
    }

    const { data: habits, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch habits', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: habits || [],
      count: (habits || []).length,
    });
  } catch (error: any) {
    console.error('Error fetching habits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habits', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/habits
 * Create a new habit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      description,
      frequency = 'daily',
      target_count = 1,
      is_active = true,
      time_block,
      stack_with_habit_id,
      ai_parsed_data,
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'monthly'];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: `frequency must be one of: ${validFrequencies.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate target_count
    if (target_count < 1) {
      return NextResponse.json(
        { error: 'target_count must be at least 1' },
        { status: 400 }
      );
    }

    // Build ai_parsed_data with stacking info
    const parsedData = ai_parsed_data || {};
    if (time_block) {
      parsedData.time_block = time_block;
    }
    if (stack_with_habit_id) {
      // Validate the habit exists
      const { data: stackHabit, error: stackError } = await supabase
        .from('habits')
        .select('id, name')
        .eq('id', stack_with_habit_id)
        .single();

      if (stackError || !stackHabit) {
        return NextResponse.json(
          { error: 'Invalid stack_with_habit_id' },
          { status: 400 }
        );
      }

      parsedData.stack_with_habit_id = stack_with_habit_id;
      parsedData.stack_with_habit_name = stackHabit.name;
    }

    const { data, error } = await supabase
      .from('habits')
      .insert({
        name,
        description: description || null,
        frequency,
        target_count,
        is_active,
        ai_parsed_data: Object.keys(parsedData).length > 0 ? parsedData : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create habit', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating habit:', error);
    return NextResponse.json(
      { error: 'Failed to create habit', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/habits?id=<uuid>
 * Update a habit
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
      name,
      description,
      frequency,
      target_count,
      is_active,
      time_block,
      stack_with_habit_id,
      ai_parsed_data,
    } = body;

    // Validate frequency if provided
    if (frequency) {
      const validFrequencies = ['daily', 'weekly', 'monthly'];
      if (!validFrequencies.includes(frequency)) {
        return NextResponse.json(
          { error: `frequency must be one of: ${validFrequencies.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate target_count if provided
    if (target_count !== undefined && target_count < 1) {
      return NextResponse.json(
        { error: 'target_count must be at least 1' },
        { status: 400 }
      );
    }

    // Get existing habit to merge ai_parsed_data
    const { data: existing, error: fetchError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      );
    }

    // Merge ai_parsed_data
    const updatedParsedData = { ...(existing.ai_parsed_data || {}), ...(ai_parsed_data || {}) };

    if (time_block !== undefined) {
      if (time_block === null) {
        delete updatedParsedData.time_block;
      } else {
        updatedParsedData.time_block = time_block;
      }
    }

    if (stack_with_habit_id !== undefined) {
      if (stack_with_habit_id === null) {
        delete updatedParsedData.stack_with_habit_id;
        delete updatedParsedData.stack_with_habit_name;
      } else {
        // Validate the habit exists
        const { data: stackHabit, error: stackError } = await supabase
          .from('habits')
          .select('id, name')
          .eq('id', stack_with_habit_id)
          .single();

        if (stackError || !stackHabit) {
          return NextResponse.json(
            { error: 'Invalid stack_with_habit_id' },
            { status: 400 }
          );
        }

        updatedParsedData.stack_with_habit_id = stack_with_habit_id;
        updatedParsedData.stack_with_habit_name = stackHabit.name;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (target_count !== undefined) updateData.target_count = target_count;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (Object.keys(updatedParsedData).length > 0) {
      updateData.ai_parsed_data = updatedParsedData;
    }

    const { data, error } = await supabase
      .from('habits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update habit', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error updating habit:', error);
    return NextResponse.json(
      { error: 'Failed to update habit', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/habits?id=<uuid>
 * Delete a habit
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

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete habit', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Habit deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting habit:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit', details: error.message },
      { status: 500 }
    );
  }
}
