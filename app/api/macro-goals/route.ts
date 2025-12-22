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

    // Get single macro goal by ID
    if (id) {
      const goalWithProgress = await getMacroGoalWithProgress(id);

      if (!goalWithProgress) {
        return NextResponse.json(
          { error: 'Macro goal not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: goalWithProgress,
      });
    }

    // Get all macro goals grouped by life area
    if (groupByArea) {
      const grouped = await getGoalsByLifeArea();

      return NextResponse.json({
        success: true,
        data: grouped,
      });
    }

    // Get all macro goals with progress
    const { data: macroGoals, error } = await supabase
      .from('macro_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch macro goals', details: error.message },
        { status: 500 }
      );
    }

    // Add progress to each goal
    const goalsWithProgress = await Promise.all(
      (macroGoals || []).map(async (goal: any) => {
        const goalWithProgress = await getMacroGoalWithProgress(goal.id);
        return goalWithProgress;
      })
    );

    return NextResponse.json({
      success: true,
      data: goalsWithProgress,
      count: goalsWithProgress.length,
    });
  } catch (error: any) {
    console.error('Error fetching macro goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch macro goals', details: error.message },
      { status: 500 }
    );
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
