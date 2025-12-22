import { NextRequest, NextResponse } from 'next/server';
import {
  getWeightTrend,
  getCaloriesTrend,
  getWorkoutTrend,
} from '@/lib/health-metrics-utils';

/**
 * GET /api/health/trends?type=<type>&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * Get trend data for graphs
 *
 * Types: weight, calories, workout
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!type) {
      return NextResponse.json(
        { error: 'type parameter is required (weight, calories, or workout)' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date parameters are required' },
        { status: 400 }
      );
    }

    let trendData: any[];

    switch (type) {
      case 'weight':
        trendData = await getWeightTrend(startDate, endDate);
        break;

      case 'calories':
        trendData = await getCaloriesTrend(startDate, endDate);
        break;

      case 'workout':
        trendData = await getWorkoutTrend(startDate, endDate);
        break;

      default:
        return NextResponse.json(
          { error: `Invalid type. Must be: weight, calories, or workout` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      period: {
        start_date: startDate,
        end_date: endDate,
      },
      data: trendData,
      count: trendData.length,
    });
  } catch (error: any) {
    console.error('Error fetching health trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health trends', details: error.message },
      { status: 500 }
    );
  }
}
