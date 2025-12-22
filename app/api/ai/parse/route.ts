import { NextRequest, NextResponse } from 'next/server';
import { parseGeneral } from '@/lib/ai-parse-utils';

/**
 * POST /api/ai/parse
 * General-purpose AI parsing with custom instructions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, instructions } = body;

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
    const result = await parseGeneral(text, instructions);

    return NextResponse.json({
      success: true,
      data: result,
      cached: result.from_cache || false,
    });
  } catch (error: any) {
    console.error('Error parsing text:', error);

    // Check if it's an OpenRouter API error
    if (error.message?.includes('OpenRouter')) {
      return NextResponse.json(
        {
          error: 'AI service error',
          details: error.message,
          suggestion: 'Please check your OpenRouter API key configuration',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to parse text', details: error.message },
      { status: 500 }
    );
  }
}
