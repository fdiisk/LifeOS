import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getMicroGoalWithProgress } from '@/lib/goals-utils';

/**
 * GET /api/micro-goals
 * Get all micro goals with progress, optionally filtered by macro_goal_id
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const macroGoalId = searchParams.get('macro_goal_id');

    // Get single micro goal by ID
    if (id) {
      const goalWithProgress = await getMicroGoalWithProgress(id);

      if (!goalWithProgress) {
        return NextResponse.json(
          { error: 'Micro goal not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: goalWithProgress,
      });
    }

    // Build query
    let query = supabase
      .from('micro_goals')
      .select('*, macro_goals(id, title, status)')
      .order('created_at', { ascending: false });

    // Filter by macro_goal_id if provided
    if (macroGoalId) {
      query = query.eq('macro_goal_id', macroGoalId);
    }

    const { data: microGoals, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch micro goals', details: error.message },
        { status: 500 }
      );
    }

    // Add progress to each goal
    const goalsWithProgress = await Promise.all(
      (microGoals || []).map(async (goal: any) => {
        const goalWithProgress = await getMicroGoalWithProgress(goal.id);
        return goalWithProgress;
      })
    );

    return NextResponse.json({
      success: true,
      data: goalsWithProgress,
      count: goalsWithProgress.length,
    });
  } catch (error: any) {
    console.error('Error fetching micro goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch micro goals', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/micro-goals
 * Create a new micro goal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      macro_goal_id,
      title,
      description,
      status = 'active',
      target_date,
      ai_parsed_data,
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    // Validate macro_goal_id if provided
    if (macro_goal_id) {
      const { data: macroGoal, error: macroError } = await supabase
        .from('macro_goals')
        .select('id')
        .eq('id', macro_goal_id)
        .single();

      if (macroError || !macroGoal) {
        return NextResponse.json(
          { error: 'Invalid macro_goal_id' },
          { status: 400 }
        );
      }
    }

    // Validate status
    const validStatuses = ['active', 'completed', 'archived', 'abandoned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('micro_goals')
      .insert({
        macro_goal_id: macro_goal_id || null,
        title,
        description: description || null,
        status,
        target_date: target_date || null,
        ai_parsed_data: ai_parsed_data || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create micro goal', details: error.message },
        { status: 500 }
      );
    }

    // Return with progress (will be 0 for new goal)
    const goalWithProgress = await getMicroGoalWithProgress(data.id);

    return NextResponse.json({
      success: true,
      data: goalWithProgress,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating micro goal:', error);
    return NextResponse.json(
      { error: 'Failed to create micro goal', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/micro-goals?id=<uuid>
 * Update a micro goal
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
      macro_goal_id,
      title,
      description,
      status,
      target_date,
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

    // Validate macro_goal_id if provided
    if (macro_goal_id) {
      const { data: macroGoal, error: macroError } = await supabase
        .from('macro_goals')
        .select('id')
        .eq('id', macro_goal_id)
        .single();

      if (macroError || !macroGoal) {
        return NextResponse.json(
          { error: 'Invalid macro_goal_id' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (macro_goal_id !== undefined) updateData.macro_goal_id = macro_goal_id;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (target_date !== undefined) updateData.target_date = target_date;
    if (ai_parsed_data !== undefined) updateData.ai_parsed_data = ai_parsed_data;

    const { data, error } = await supabase
      .from('micro_goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update micro goal', details: error.message },
        { status: 500 }
      );
    }

    const goalWithProgress = await getMicroGoalWithProgress(data.id);

    return NextResponse.json({
      success: true,
      data: goalWithProgress,
    });
  } catch (error: any) {
    console.error('Error updating micro goal:', error);
    return NextResponse.json(
      { error: 'Failed to update micro goal', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/micro-goals?id=<uuid>
 * Delete a micro goal (tasks will have micro_goal_id set to null)
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
      .from('micro_goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete micro goal', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Micro goal deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting micro goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete micro goal', details: error.message },
      { status: 500 }
    );
  }
}
