import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateRequestSchema } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { buildGenerationPrompt } from '@/lib/prompts/generation';
import { GeneratedQuestionsSchema } from '@/lib/prompts/schemas';

export async function POST(request: NextRequest) {
  try {
    // 1. Admin authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN', status: 403 },
        { status: 403 }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const parsed = generateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          status: 400,
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { plan, content, existing_questions } = parsed.data;

    // 3. Build prompt
    const prompt = buildGenerationPrompt({
      generationPlanJSON: plan,
      pastedContent: content,
      existingQuestionsList: existing_questions,
    });

    // 4. Call Anthropic API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    });

    // Extract text content from the response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'AI returned no text content', code: 'AI_SERVICE_ERROR', status: 502 },
        { status: 502 }
      );
    }

    // Parse the JSON from the response text
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'AI response did not contain valid JSON', code: 'AI_SERVICE_ERROR', status: 502 },
        { status: 502 }
      );
    }

    const questionsParsed = GeneratedQuestionsSchema.safeParse(
      JSON.parse(jsonMatch[0])
    );
    if (!questionsParsed.success) {
      return NextResponse.json(
        {
          error: 'AI response did not match expected schema',
          code: 'AI_SERVICE_ERROR',
          status: 502,
          details: questionsParsed.error.flatten().fieldErrors,
        },
        { status: 502 }
      );
    }

    // 5. Return the generated questions
    return NextResponse.json({ questions: questionsParsed.data.questions });
  } catch (error) {
    console.error('[POST /api/ai/generate] Error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'VALIDATION_ERROR', status: 400 },
        { status: 400 }
      );
    }

    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED', status: 429 },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'AI service error', code: 'AI_SERVICE_ERROR', status: 502 },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_SERVER_ERROR', status: 500 },
      { status: 500 }
    );
  }
}
