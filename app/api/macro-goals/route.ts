import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMacroGoalWithProgress, getGoalsByLifeArea } from '@/lib/goals-utils';

/**
 * GET /api/macro-goals
 * Get all macro goals with progress, optionally grouped by life area
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const groupByArea = searchParams.get('group_by_area') === 'true';
    const status = searchParams.get('status');
    const includeProgress = searchParams.get('include_progress') === 'true';

    // Get single macro goal by ID
    if (id) {
      try {
        const goalWithProgress = await getMacroGoalWithProgress(id);

        if (!goalWithProgress) {
          return NextResponse.json({ macro_goal: null }, { status: 200 });
        }

        return NextResponse.json({ macro_goal: goalWithProgress });
      } catch (err) {
        console.error('Error fetching single goal:', err);
        return NextResponse.json({ macro_goal: null }, { status: 200 });
      }
    }

    // Get all macro goals grouped by life area
    if (groupByArea) {
      try {
        const grouped = await getGoalsByLifeArea();
        return NextResponse.json({ grouped: grouped || {} });
      } catch (err) {
        console.error('Error grouping by area:', err);
        return NextResponse.json({ grouped: {} }, { status: 200 });
      }
    }

    // Get all macro goals
    try {
      let query = supabase.from('macro_goals').select('*');

      // Filter by status if provided
      if (status) {
        query = query.eq('status', status);
      }

      const { data: macroGoals, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ macro_goals: [] }, { status: 200 });
      }

      // Add progress if requested
      if (includeProgress) {
        const goalsWithProgress = await Promise.all(
          (macroGoals || []).map(async (goal: any) => {
            try {
              const goalWithProgress = await getMacroGoalWithProgress(goal.id);
              return goalWithProgress || { ...goal, progress: 0 };
            } catch (err) {
              console.error(`Error calculating progress for goal ${goal.id}:`, err);
              return { ...goal, progress: 0 };
            }
          })
        );

        return NextResponse.json({ macro_goals: goalsWithProgress });
      }

      return NextResponse.json({ macro_goals: macroGoals || [] });
    } catch (err) {
      console.error('Error fetching macro goals:', err);
      return NextResponse.json({ macro_goals: [] }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error in macro goals GET:', error);
    return NextResponse.json({ macro_goals: [] }, { status: 200 });
  }
}

/**
 * POST /api/macro-goals
 * Create a new macro goal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      status = 'active',
      target_date,
      life_area,
      ai_parsed_data,
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['active', 'completed', 'archived', 'abandoned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Add life_area to ai_parsed_data if provided
    const parsedData = ai_parsed_data || {};
    if (life_area) {
      parsedData.life_area = life_area;
    }

    const { data, error } = await supabase
      .from('macro_goals')
      .insert({
        title,
        description: description || null,
        status,
        target_date: target_date || null,
        ai_parsed_data: Object.keys(parsedData).length > 0 ? parsedData : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create macro goal', details: error.message },
        { status: 500 }
      );
    }

    // Return with progress (will be 0 for new goal)
    const goalWithProgress = await getMacroGoalWithProgress(data.id);

    return NextResponse.json({
      success: true,
      data: goalWithProgress,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating macro goal:', error);
    return NextResponse.json(
      { error: 'Failed to create macro goal', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/macro-goals?id=<uuid>
 * Update a macro goal
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
      title,
      description,
      status,
      target_date,
      life_area,
      ai_parsed_data,
    } = body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['active', 'completed', 'archived', 'abandoned'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `status must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Get existing goal to merge ai_parsed_data
    const { data: existing, error: fetchError } = await supabase
      .from('macro_goals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Macro goal not found' },
        { status: 404 }
      );
    }

    // Merge ai_parsed_data
    const updatedParsedData = { ...(existing.ai_parsed_data || {}), ...(ai_parsed_data || {}) };
    if (life_area) {
      updatedParsedData.life_area = life_area;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (target_date !== undefined) updateData.target_date = target_date;
    if (Object.keys(updatedParsedData).length > 0) {
      updateData.ai_parsed_data = updatedParsedData;
    }

    const { data, error } = await supabase
      .from('macro_goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update macro goal', details: error.message },
        { status: 500 }
      );
    }

    const goalWithProgress = await getMacroGoalWithProgress(data.id);

    return NextResponse.json({
      success: true,
      data: goalWithProgress,
    });
  } catch (error: any) {
    console.error('Error updating macro goal:', error);
    return NextResponse.json(
      { error: 'Failed to update macro goal', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/macro-goals?id=<uuid>
 * Delete a macro goal (and cascade to micro goals and tasks)
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
      .from('macro_goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete macro goal', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Macro goal deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting macro goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete macro goal', details: error.message },
      { status: 500 }
    );
  }
}
