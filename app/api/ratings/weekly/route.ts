import { NextRequest, NextResponse } from 'next/server';
import { calculateWeeklySummary } from '@/lib/ratings-utils';

/**
 * GET /api/ratings/weekly
 * Get weekly summary of subjective and objective ratings with trends
 * Query params:
 *   - week_start: Start date of the week (YYYY-MM-DD), defaults to current week's Monday
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let weekStart = searchParams.get('week_start');

    // Default to current week's Monday if not provided
    if (!weekStart) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      weekStart = monday.toISOString().split('T')[0];
    }

    const summary = await calculateWeeklySummary(weekStart);

    return NextResponse.json({
      summary,
      message: 'Weekly summary calculated successfully',
    });
  } catch (error) {
    console.error('Error calculating weekly summary:', error);
    return NextResponse.json(
      { error: 'Failed to calculate weekly summary' },
      { status: 500 }
    );
  }
}
