import { NextRequest, NextResponse } from 'next/server';
import { parseGym } from '@/lib/ai-parse-utils';

/**
 * POST /api/ai/parse/gym
 * Parse gym workout text using AI to extract exercise information
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
      const result = await parseGym(text);

      // Check if any exercises need clarification
      const needsClarification = result.exercises?.some(
        (ex: any) => ex.needs_clarification
      );

      return NextResponse.json({
        result,
        success: true,
        cached: result.from_cache || false,
        needs_clarification: needsClarification,
        clarification_questions: result.exercises
          ?.filter((ex: any) => ex.needs_clarification)
          .map((ex: any) => ({
            exercise: ex.name,
            question: ex.clarification_question,
          })),
      });
    } catch (parseError: any) {
      console.error('Error parsing gym workout:', parseError);

      // Return safe fallback instead of error
      return NextResponse.json({
        result: {
          exercises: [],
          workout_type: 'General',
          from_cache: false,
          error: 'AI parsing unavailable. Please configure OpenRouter API key.',
        },
        success: false,
      });
    }
  } catch (error: any) {
    console.error('Error in gym parse route:', error);

    // Return safe fallback
    return NextResponse.json({
      result: {
        exercises: [],
        workout_type: 'General',
        from_cache: false,
        error: 'Request failed. Please try again.',
      },
      success: false,
    });
  }
}
