import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/settings
 * Get user settings
 */
export async function GET(request: NextRequest) {
  try {
    // For single-user app, get the first (and only) settings record
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .is('user_id', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings', success: false },
        { status: 200 }
      );
    }

    // If no settings found, return default structure
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          height_cm: null,
          current_weight_kg: null,
          goal_weight_kg: null,
          age: null,
          goal_calories: null,
          target_deficit_calories: null,
          macro_profiles: [],
          active_macro_profile_id: null,
          caffeine_tracking_enabled: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', success: false },
      { status: 200 }
    );
  }
}

/**
 * PATCH /api/settings
 * Update user settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      height_cm,
      current_weight_kg,
      goal_weight_kg,
      age,
      goal_calories,
      target_deficit_calories,
      macro_profiles,
      active_macro_profile_id,
      caffeine_tracking_enabled,
    } = body;

    // Validation
    if (height_cm !== undefined && height_cm !== null) {
      if (height_cm < 50 || height_cm > 300) {
        return NextResponse.json(
          { error: 'height_cm must be between 50 and 300', success: false },
          { status: 200 }
        );
      }
    }

    if (current_weight_kg !== undefined && current_weight_kg !== null) {
      if (current_weight_kg < 20 || current_weight_kg > 500) {
        return NextResponse.json(
          { error: 'current_weight_kg must be between 20 and 500', success: false },
          { status: 200 }
        );
      }
    }

    if (goal_weight_kg !== undefined && goal_weight_kg !== null) {
      if (goal_weight_kg < 20 || goal_weight_kg > 500) {
        return NextResponse.json(
          { error: 'goal_weight_kg must be between 20 and 500', success: false },
          { status: 200 }
        );
      }
    }

    if (age !== undefined && age !== null) {
      if (age < 1 || age > 150) {
        return NextResponse.json(
          { error: 'age must be between 1 and 150', success: false },
          { status: 200 }
        );
      }
    }

    if (goal_calories !== undefined && goal_calories !== null) {
      if (goal_calories < 500 || goal_calories > 10000) {
        return NextResponse.json(
          { error: 'goal_calories must be between 500 and 10000', success: false },
          { status: 200 }
        );
      }
    }

    if (target_deficit_calories !== undefined && target_deficit_calories !== null) {
      if (target_deficit_calories < 0 || target_deficit_calories > 2000) {
        return NextResponse.json(
          { error: 'target_deficit_calories must be between 0 and 2000', success: false },
          { status: 200 }
        );
      }
    }

    // Validate macro profiles if provided
    if (macro_profiles !== undefined) {
      if (!Array.isArray(macro_profiles)) {
        return NextResponse.json(
          { error: 'macro_profiles must be an array', success: false },
          { status: 200 }
        );
      }

      for (const profile of macro_profiles) {
        if (!profile.id || !profile.name) {
          return NextResponse.json(
            { error: 'Each macro profile must have id and name', success: false },
            { status: 200 }
          );
        }

        const total =
          (profile.protein_percent || 0) +
          (profile.carbs_percent || 0) +
          (profile.fat_percent || 0);

        if (Math.abs(total - 100) > 0.1) {
          return NextResponse.json(
            { error: `Macro percentages must sum to 100 for profile "${profile.name}"`, success: false },
            { status: 200 }
          );
        }
      }
    }

    // Check if settings record exists
    const { data: existing, error: fetchError } = await supabase
      .from('user_settings')
      .select('id')
      .is('user_id', null)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching settings:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch settings', success: false },
        { status: 200 }
      );
    }

    const updateData: any = {};
    if (height_cm !== undefined) updateData.height_cm = height_cm;
    if (current_weight_kg !== undefined) updateData.current_weight_kg = current_weight_kg;
    if (goal_weight_kg !== undefined) updateData.goal_weight_kg = goal_weight_kg;
    if (age !== undefined) updateData.age = age;
    if (goal_calories !== undefined) updateData.goal_calories = goal_calories;
    if (target_deficit_calories !== undefined)
      updateData.target_deficit_calories = target_deficit_calories;
    if (macro_profiles !== undefined) updateData.macro_profiles = macro_profiles;
    if (active_macro_profile_id !== undefined)
      updateData.active_macro_profile_id = active_macro_profile_id;
    if (caffeine_tracking_enabled !== undefined)
      updateData.caffeine_tracking_enabled = caffeine_tracking_enabled;

    let result;
    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('user_settings')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json(
          { error: 'Failed to update settings', success: false },
          { status: 200 }
        );
      }

      result = data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: null,
          ...updateData,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json(
          { error: 'Failed to create settings', success: false },
          { status: 200 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Settings updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', success: false },
      { status: 200 }
    );
  }
}
