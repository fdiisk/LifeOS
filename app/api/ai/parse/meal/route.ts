import { NextRequest, NextResponse } from 'next/server';
import { parseMeal } from '@/lib/ai-parse-utils';

/**
 * POST /api/ai/parse/meal
 * Parse meal text using AI to extract nutritional information
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'text field is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: 'text cannot be empty' },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: 'text cannot exceed 2000 characters' },
        { status: 400 }
      );
    }

    // Parse using AI (with automatic caching)
    try {
      const result = await parseMeal(text);
      return NextResponse.json({ result, success: true });
    } catch (parseError: any) {
      console.error('Error parsing meal:', parseError);

      // Return safe fallback instead of error
      return NextResponse.json({
        result: {
          total_calories: 0,
          macros: {
            protein: 0,
            carbs: 0,
            fats: 0,
          },
          items: [],
          from_cache: false,
          error: 'AI parsing unavailable. Please configure OpenRouter API key.',
        },
        success: false,
      });
    }
  } catch (error: any) {
    console.error('Error in meal parse route:', error);

    // Return safe fallback
    return NextResponse.json({
      result: {
        total_calories: 0,
        macros: {
          protein: 0,
          carbs: 0,
          fats: 0,
        },
        items: [],
        from_cache: false,
        error: 'Request failed. Please try again.',
      },
      success: false,
    });
  }
}
