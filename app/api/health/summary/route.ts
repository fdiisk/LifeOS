import { NextRequest, NextResponse } from 'next/server';
import { getDailyNetCalories, getWeeklySummary } from '@/lib/health-metrics-utils';

/**
 * GET /api/health/summary?date=YYYY-MM-DD
 * Get daily net calories
 *
 * GET /api/health/summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * Get weekly summary
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Daily summary
    if (date) {
      const summary = await getDailyNetCalories(date);

      return NextResponse.json({
        success: true,
        type: 'daily',
        data: summary,
      });
    }

    // Weekly summary
    if (startDate && endDate) {
      const summary = await getWeeklySummary(startDate, endDate);

      return NextResponse.json({
        success: true,
        type: 'weekly',
        data: summary,
      });
    }

    // Default: last 7 days summary
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const defaultStartDate = sevenDaysAgo.toISOString().split('T')[0];
    const defaultEndDate = today.toISOString().split('T')[0];

    const summary = await getWeeklySummary(defaultStartDate, defaultEndDate);

    return NextResponse.json({
      success: true,
      type: 'weekly',
      data: summary,
    });
  } catch (error: any) {
    console.error('Error fetching health summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health summary', details: error.message },
      { status: 500 }
    );
  }
}
