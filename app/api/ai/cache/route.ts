import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/ai-parse-utils';

/**
 * GET /api/ai/cache
 * Get AI parsing cache statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await getCacheStats();

    if (!stats) {
      return NextResponse.json({
        success: true,
        data: {
          total_entries: 0,
          total_cache_hits: 0,
          by_type: {},
          cache_efficiency: '0%',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache stats', details: error.message },
      { status: 500 }
    );
  }
}
