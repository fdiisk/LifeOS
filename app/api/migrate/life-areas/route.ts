import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LIFE_AREA_MIGRATION_MAP } from '@/lib/life-areas';

/**
 * POST /api/migrate/life-areas
 *
 * One-time migration endpoint to update life_area values in macro_goals table
 * from old format (Financial, Health, Professional, etc.) to new format
 * (financial, personal, relationships, recreation, career, hobbies, health)
 *
 * This is a safe, non-destructive migration that normalizes existing data.
 */
export async function POST(request: NextRequest) {
  try {
    // Fetch all macro goals
    const { data: goals, error: fetchError } = await supabase
      .from('macro_goals')
      .select('id, ai_parsed_data');

    if (fetchError) {
      console.error('Error fetching macro goals:', fetchError);
      return NextResponse.json(
        {
          error: 'Failed to fetch macro goals',
          details: fetchError.message,
          success: false,
        },
        { status: 200 }
      );
    }

    if (!goals || goals.length === 0) {
      return NextResponse.json({
        message: 'No macro goals found to migrate',
        updated: 0,
        success: true,
      });
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // Process each goal
    for (const goal of goals) {
      const currentLifeArea = goal.ai_parsed_data?.life_area;

      // Skip if no life_area is set
      if (!currentLifeArea) {
        continue;
      }

      // Get the new life area value
      const newLifeArea = LIFE_AREA_MIGRATION_MAP[currentLifeArea];

      // Skip if already using new format
      if (newLifeArea === currentLifeArea) {
        continue;
      }

      // Update the ai_parsed_data with new life_area
      const updatedParsedData = {
        ...(goal.ai_parsed_data || {}),
        life_area: newLifeArea,
      };

      const { error: updateError } = await supabase
        .from('macro_goals')
        .update({
          ai_parsed_data: updatedParsedData,
        })
        .eq('id', goal.id);

      if (updateError) {
        console.error(`Error updating goal ${goal.id}:`, updateError);
        errors.push(`Goal ${goal.id}: ${updateError.message}`);
      } else {
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `Migration completed. Updated ${updatedCount} out of ${goals.length} macro goals.`,
      total_goals: goals.length,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
      success: true,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message,
        success: false,
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/migrate/life-areas
 *
 * Preview what would be migrated without making changes
 */
export async function GET(request: NextRequest) {
  try {
    const { data: goals, error: fetchError } = await supabase
      .from('macro_goals')
      .select('id, title, ai_parsed_data');

    if (fetchError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch macro goals',
          details: fetchError.message,
        },
        { status: 200 }
      );
    }

    if (!goals || goals.length === 0) {
      return NextResponse.json({
        message: 'No macro goals found',
        preview: [],
      });
    }

    const preview = goals
      .map((goal) => {
        const currentLifeArea = goal.ai_parsed_data?.life_area;
        if (!currentLifeArea) return null;

        const newLifeArea = LIFE_AREA_MIGRATION_MAP[currentLifeArea];
        if (newLifeArea === currentLifeArea) return null;

        return {
          id: goal.id,
          title: goal.title,
          current_life_area: currentLifeArea,
          new_life_area: newLifeArea,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      message: `Found ${preview.length} goals that need migration out of ${goals.length} total`,
      preview,
      total_goals: goals.length,
      needs_migration: preview.length,
    });
  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json(
      {
        error: 'Preview failed',
        details: error.message,
      },
      { status: 200 }
    );
  }
}
