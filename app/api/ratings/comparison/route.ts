import { NextRequest, NextResponse } from 'next/server';
import { calculatePerceivedVsActual } from '@/lib/ratings-utils';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/ratings/comparison
 * Compare perceived (subjective) vs actual (objective) performance
 * Query params:
 *   - date: specific date (YYYY-MM-DD)
 *   - start_date: start of range (YYYY-MM-DD)
 *   - end_date: end of range (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (date) {
      // Get comparison for single date
      try {
        const comparison = await calculatePerceivedVsActual(date);
        return NextResponse.json({
          comparison,
          message: 'Comparison calculated successfully',
        });
      } catch (error: any) {
        if (error.message?.includes('No rating found')) {
          return NextResponse.json(
            { error: 'No subjective rating found for this date. Please create a rating first.' },
            { status: 404 }
          );
        }
        throw error;
      }
    } else if (startDate && endDate) {
      // Get comparisons for date range
      const { data: ratings } = await supabase
        .from('daily_ratings')
        .select('date')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (!ratings || ratings.length === 0) {
        return NextResponse.json({
          comparisons: [],
          summary: null,
          message: 'No ratings found in this date range',
        });
      }

      // Calculate comparisons for all dates
      const comparisons = await Promise.all(
        ratings.map(r => calculatePerceivedVsActual(r.date))
      );

      // Calculate summary statistics
      const totalGap = comparisons.reduce((sum, c) => sum + Math.abs(c.gap.effort_vs_completion), 0);
      const avgAbsoluteGap = Math.round(totalGap / comparisons.length);
      const avgPerceptionAccuracy = Math.round(
        comparisons.reduce((sum, c) => sum + c.gap.perception_accuracy, 0) / comparisons.length
      );

      const categoryCounts = {
        accurate: comparisons.filter(c => c.gap.category === 'accurate').length,
        overestimating: comparisons.filter(c => c.gap.category === 'overestimating').length,
        underestimating: comparisons.filter(c => c.gap.category === 'underestimating').length,
      };

      const dominantCategory = Object.entries(categoryCounts).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )[0];

      return NextResponse.json({
        comparisons,
        summary: {
          date_range: { start: startDate, end: endDate },
          total_days: comparisons.length,
          avg_absolute_gap: avgAbsoluteGap,
          avg_perception_accuracy: avgPerceptionAccuracy,
          category_breakdown: categoryCounts,
          dominant_category: dominantCategory,
          insight: generateRangeInsight(dominantCategory, avgPerceptionAccuracy, categoryCounts),
        },
        message: 'Comparisons calculated successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Please provide either date or start_date and end_date' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error calculating comparison:', error);
    return NextResponse.json(
      { error: 'Failed to calculate comparison' },
      { status: 500 }
    );
  }
}

/**
 * Generate insight for range comparison
 */
function generateRangeInsight(
  dominantCategory: string,
  avgAccuracy: number,
  counts: { accurate: number; overestimating: number; underestimating: number }
): string {
  if (avgAccuracy >= 85) {
    return 'Excellent self-awareness! Your perceived effort consistently aligns with actual performance.';
  }

  if (dominantCategory === 'overestimating') {
    if (counts.overestimating > counts.accurate + counts.underestimating) {
      return 'You tend to feel like you\'re working harder than the results show. Consider identifying blockers, distractions, or tasks that take longer than expected.';
    } else {
      return 'There\'s a slight tendency to overestimate effort. Look for opportunities to improve efficiency or break down complex tasks.';
    }
  }

  if (dominantCategory === 'underestimating') {
    if (counts.underestimating > counts.accurate + counts.overestimating) {
      return 'You\'re consistently achieving more than you give yourself credit for! This suggests good productivity and possible flow states.';
    } else {
      return 'You may be undervaluing your efforts. Make sure to acknowledge the work you\'re putting in.';
    }
  }

  return 'Your self-perception is generally balanced. Keep monitoring to maintain this awareness.';
}
