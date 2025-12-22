import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/daily-logs/tasks?date=YYYY-MM-DD
 * Attach completed tasks to a daily log
 */
export async function POST(request: NextRequest) {
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
    const { task_ids, notes } = body;

    if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
      return NextResponse.json(
        { error: 'task_ids array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate that all tasks exist
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status')
      .in('id', task_ids);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return NextResponse.json(
        { error: 'Failed to validate tasks', details: tasksError.message },
        { status: 500 }
      );
    }

    if (!tasksData || tasksData.length !== task_ids.length) {
      return NextResponse.json(
        { error: 'One or more task IDs are invalid' },
        { status: 400 }
      );
    }

    // Create daily log entries for each task
    const logEntries = task_ids.map((task_id) => ({
      log_date: date,
      task_id,
      notes: notes || null,
    }));

    const { data, error } = await supabase
      .from('daily_logs')
      .insert(logEntries)
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to attach tasks to daily log', details: error.message },
        { status: 500 }
      );
    }

    // Mark tasks as completed if they aren't already
    const taskIdsToComplete = tasksData
      .filter((task: any) => task.status !== 'completed')
      .map((task: any) => task.id);

    if (taskIdsToComplete.length > 0) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .in('id', taskIdsToComplete);

      if (updateError) {
        console.error('Error updating task status:', updateError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        logs_created: data.length,
        tasks_completed: taskIdsToComplete.length,
        logs: data,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error attaching tasks to daily log:', error);
    return NextResponse.json(
      { error: 'Failed to attach tasks to daily log', details: error.message },
      { status: 500 }
    );
  }
}
