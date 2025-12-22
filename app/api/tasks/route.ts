import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTaskStats } from '@/lib/goals-utils';

/**
 * GET /api/tasks
 * Get all tasks, optionally filtered by status, priority, or micro_goal_id
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const microGoalId = searchParams.get('micro_goal_id');
    const dueDate = searchParams.get('due_date');
    const includeStats = searchParams.get('include_stats') === 'true';

    // Get single task by ID
    if (id) {
      try {
        const { data: task, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !task) {
          return NextResponse.json({ task: null }, { status: 200 });
        }

        return NextResponse.json({ task });
      } catch (err) {
        console.error('Error fetching single task:', err);
        return NextResponse.json({ task: null }, { status: 200 });
      }
    }

    // Build query without joins for better compatibility
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true });

      // Apply filters
      if (status) {
        // Support comma-separated status values
        const statusValues = status.split(',').map(s => s.trim());
        if (statusValues.length === 1) {
          query = query.eq('status', statusValues[0]);
        } else {
          query = query.in('status', statusValues);
        }
      }
      if (priority) {
        query = query.eq('priority', priority);
      }
      if (microGoalId) {
        query = query.eq('micro_goal_id', microGoalId);
      }
      if (dueDate) {
        query = query.eq('due_date', dueDate);
      }

      const { data: tasks, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ tasks: [] }, { status: 200 });
      }

      const response: any = {
        tasks: tasks || [],
        count: (tasks || []).length,
      };

      // Include statistics if requested
      if (includeStats) {
        try {
          const stats = await getTaskStats({
            status: status || undefined,
            priority: priority || undefined,
            micro_goal_id: microGoalId || undefined
          });
          response.stats = stats;
        } catch (statsError) {
          console.error('Error calculating stats:', statsError);
          response.stats = null;
        }
      }

      return NextResponse.json(response);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      return NextResponse.json({ tasks: [] }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error in tasks GET:', error);
    return NextResponse.json({ tasks: [] }, { status: 200 });
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      micro_goal_id,
      title,
      description,
      status = 'pending',
      priority = 'medium',
      due_date,
      ai_parsed_data,
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    // Validate micro_goal_id if provided
    if (micro_goal_id) {
      const { data: microGoal, error: microError } = await supabase
        .from('micro_goals')
        .select('id')
        .eq('id', micro_goal_id)
        .single();

      if (microError || !microGoal) {
        return NextResponse.json(
          { error: 'Invalid micro_goal_id' },
          { status: 400 }
        );
      }
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `priority must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        micro_goal_id: micro_goal_id || null,
        title,
        description: description || null,
        status,
        priority,
        due_date: due_date || null,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        ai_parsed_data: ai_parsed_data || null,
      })
      .select('*, micro_goals(id, title, macro_goals(id, title))')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create task', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks?id=<uuid>
 * Update a task
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
      micro_goal_id,
      title,
      description,
      status,
      priority,
      due_date,
      ai_parsed_data,
    } = body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `status must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate priority if provided
    if (priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: `priority must be one of: ${validPriorities.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate micro_goal_id if provided
    if (micro_goal_id) {
      const { data: microGoal, error: microError } = await supabase
        .from('micro_goals')
        .select('id')
        .eq('id', micro_goal_id)
        .single();

      if (microError || !microGoal) {
        return NextResponse.json(
          { error: 'Invalid micro_goal_id' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (micro_goal_id !== undefined) updateData.micro_goal_id = micro_goal_id;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      // Set completed_at when marking as completed
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status !== 'completed') {
        updateData.completed_at = null;
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (ai_parsed_data !== undefined) updateData.ai_parsed_data = ai_parsed_data;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select('*, micro_goals(id, title, macro_goals(id, title))')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update task', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks?id=<uuid>
 * Delete a task
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
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete task', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task', details: error.message },
      { status: 500 }
    );
  }
}
