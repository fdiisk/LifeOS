import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DailyRating } from '@/lib/types';
import { calculateObjectiveRating } from '@/lib/ratings-utils';

/**
 * GET /api/ratings
 * Get ratings for a date or date range
 * Query params:
 *   - date: specific date (YYYY-MM-DD)
 *   - start_date: start of range (YYYY-MM-DD)
 *   - end_date: end of range (YYYY-MM-DD)
 *   - include_objective: include objective ratings (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const includeObjective = searchParams.get('include_objective') === 'true';

    if (date) {
      // Get single date rating
      const { data, error } = await supabase
        .from('daily_ratings')
        .select('*')
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return NextResponse.json({ error: 'Rating not found for this date' }, { status: 404 });
      }

      let result: any = { rating: data };

      if (includeObjective) {
        const objective = await calculateObjectiveRating(date);
        result.objective = objective;
      }

      return NextResponse.json(result);
    } else if (startDate && endDate) {
      // Get range of ratings
      const { data, error } = await supabase
        .from('daily_ratings')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      let result: any = { ratings: data };

      if (includeObjective && data) {
        const objectives = await Promise.all(
          data.map(rating => calculateObjectiveRating(rating.date))
        );
        result.objectives = objectives;
      }

      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Please provide either date or start_date and end_date' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ratings
 * Create a new daily rating
 * Body: { date, focus_rating, effort_rating, mood_rating, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, focus_rating, effort_rating, mood_rating, notes } = body;

    // Validate required fields
    if (!date || focus_rating === undefined || effort_rating === undefined || mood_rating === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date, focus_rating, effort_rating, mood_rating' },
        { status: 400 }
      );
    }

    // Validate rating ranges
    if (
      focus_rating < 0 || focus_rating > 100 ||
      effort_rating < 0 || effort_rating > 100 ||
      mood_rating < 0 || mood_rating > 100
    ) {
      return NextResponse.json(
        { error: 'Ratings must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Check if rating already exists for this date
    const { data: existing } = await supabase
      .from('daily_ratings')
      .select('id')
      .eq('date', date)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Rating already exists for this date. Use PATCH to update.' },
        { status: 409 }
      );
    }

    // Create rating
    const { data, error } = await supabase
      .from('daily_ratings')
      .insert({
        date,
        focus_rating,
        effort_rating,
        mood_rating,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Also calculate and return objective rating
    const objective = await calculateObjectiveRating(date);

    return NextResponse.json(
      {
        rating: data,
        objective,
        message: 'Rating created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating rating:', error);
    return NextResponse.json(
      { error: 'Failed to create rating' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ratings
 * Update an existing rating
 * Body: { date, focus_rating?, effort_rating?, mood_rating?, notes? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, focus_rating, effort_rating, mood_rating, notes } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required field: date' },
        { status: 400 }
      );
    }

    // Validate rating ranges if provided
    if (
      (focus_rating !== undefined && (focus_rating < 0 || focus_rating > 100)) ||
      (effort_rating !== undefined && (effort_rating < 0 || effort_rating > 100)) ||
      (mood_rating !== undefined && (mood_rating < 0 || mood_rating > 100))
    ) {
      return NextResponse.json(
        { error: 'Ratings must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {};
    if (focus_rating !== undefined) updates.focus_rating = focus_rating;
    if (effort_rating !== undefined) updates.effort_rating = effort_rating;
    if (mood_rating !== undefined) updates.mood_rating = mood_rating;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update rating
    const { data, error } = await supabase
      .from('daily_ratings')
      .update(updates)
      .eq('date', date)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Rating not found for this date' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      rating: data,
      message: 'Rating updated successfully',
    });
  } catch (error) {
    console.error('Error updating rating:', error);
    return NextResponse.json(
      { error: 'Failed to update rating' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ratings
 * Delete a rating
 * Query params: date
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('daily_ratings')
      .delete()
      .eq('date', date);

    if (error) throw error;

    return NextResponse.json({
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rating:', error);
    return NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    );
  }
}
