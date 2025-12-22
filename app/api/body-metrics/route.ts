import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { kgToLbs, lbsToKg } from '@/lib/health-metrics-utils';

/**
 * GET /api/body-metrics
 * Get all body metrics, optionally filtered by date range
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Get single metric by ID
    if (id) {
      const { data: metric, error } = await supabase
        .from('body_metrics')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !metric) {
        return NextResponse.json(
          { error: 'Body metric not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: metric,
      });
    }

    // Build query
    let query = supabase
      .from('body_metrics')
      .select('*')
      .order('log_date', { ascending: false });

    if (startDate) {
      query = query.gte('log_date', startDate);
    }
    if (endDate) {
      query = query.lte('log_date', endDate);
    }

    const { data: metrics, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch body metrics', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: metrics || [],
      count: (metrics || []).length,
    });
  } catch (error: any) {
    console.error('Error fetching body metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch body metrics', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/body-metrics
 * Create a new body metric entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      log_date,
      weight_kg,
      weight_lbs,
      body_fat_percentage,
      muscle_mass_kg,
      muscle_mass_lbs,
      measurements,
      notes,
    } = body;

    // Validation
    if (!log_date) {
      return NextResponse.json(
        { error: 'log_date is required' },
        { status: 400 }
      );
    }

    // Convert units if only one is provided
    let finalWeightKg = weight_kg;
    if (!weight_kg && weight_lbs) {
      finalWeightKg = lbsToKg(weight_lbs);
    }

    let finalMuscleMassKg = muscle_mass_kg;
    if (!muscle_mass_kg && muscle_mass_lbs) {
      finalMuscleMassKg = lbsToKg(muscle_mass_lbs);
    }

    const { data, error } = await supabase
      .from('body_metrics')
      .insert({
        log_date,
        weight_kg: finalWeightKg || null,
        body_fat_percentage: body_fat_percentage || null,
        muscle_mass_kg: finalMuscleMassKg || null,
        measurements: measurements || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create body metric', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating body metric:', error);
    return NextResponse.json(
      { error: 'Failed to create body metric', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/body-metrics?id=<uuid>
 * Update a body metric entry
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
      weight_kg,
      weight_lbs,
      body_fat_percentage,
      muscle_mass_kg,
      muscle_mass_lbs,
      measurements,
      notes,
    } = body;

    // Convert units if only one is provided
    let finalWeightKg = weight_kg;
    if (weight_kg === undefined && weight_lbs !== undefined) {
      finalWeightKg = weight_lbs ? lbsToKg(weight_lbs) : null;
    }

    let finalMuscleMassKg = muscle_mass_kg;
    if (muscle_mass_kg === undefined && muscle_mass_lbs !== undefined) {
      finalMuscleMassKg = muscle_mass_lbs ? lbsToKg(muscle_mass_lbs) : null;
    }

    const updateData: any = {};
    if (log_date !== undefined) updateData.log_date = log_date;
    if (finalWeightKg !== undefined) updateData.weight_kg = finalWeightKg;
    if (body_fat_percentage !== undefined) updateData.body_fat_percentage = body_fat_percentage;
    if (finalMuscleMassKg !== undefined) updateData.muscle_mass_kg = finalMuscleMassKg;
    if (measurements !== undefined) updateData.measurements = measurements;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('body_metrics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update body metric', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error updating body metric:', error);
    return NextResponse.json(
      { error: 'Failed to update body metric', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/body-metrics?id=<uuid>
 * Delete a body metric entry
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
      .from('body_metrics')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete body metric', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Body metric deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting body metric:', error);
    return NextResponse.json(
      { error: 'Failed to delete body metric', details: error.message },
      { status: 500 }
    );
  }
}
