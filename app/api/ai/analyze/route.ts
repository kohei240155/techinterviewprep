import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { analyzeRequestSchema } from '@/types';
import type { Question } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { buildAnalysisPrompt } from '@/lib/prompts/analysis';
import { AnalysisPlanSchema } from '@/lib/prompts/schemas';

/**
 * Summarize existing questions for inclusion in the analysis prompt.
 * Keeps the context compact to save tokens while providing enough
 * information for the AI to avoid generating duplicates.
 */
function buildExistingQuestionsContext(questions: Question[]): string {
  if (!questions || questions.length === 0) return 'No existing questions.';
  return questions
    .map(
      (q, i) =>
        `${i + 1}. [${q.type}/${q.difficulty}] ${q.question_en.slice(0, 80)}`
    )
    .join('\n');
}

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
    const parsed = analyzeRequestSchema.safeParse(body);

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

    const { topic_id, content } = parsed.data;

    // 3. Fetch topic with its category
    const { data: topic, error: topicError } = await adminClient
      .from('topics')
      .select('*, categories(*)')
      .eq('id', topic_id)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found', code: 'NOT_FOUND', status: 404 },
        { status: 404 }
      );
    }

    // 4. Fetch existing questions for deduplication
    const { data: existingQuestions } = await adminClient
      .from('questions')
      .select('*')
      .eq('topic_id', topic_id)
      .is('deleted_at', null);

    // 5. Build existing questions summary
    const existingQuestionsSummary = buildExistingQuestionsContext(
      (existingQuestions as Question[]) ?? []
    );

    // 6. Build prompt
    const prompt = buildAnalysisPrompt({
      topicName_ja: topic.name_ja,
      topicName_en: topic.name_en,
      categoryName_en: topic.categories.name_en,
      pastedContent: content,
      existingQuestionsSummary,
    });

    // 7. Call Anthropic API with structured output
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
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

    const planParsed = AnalysisPlanSchema.safeParse(JSON.parse(jsonMatch[0]));
    if (!planParsed.success) {
      return NextResponse.json(
        {
          error: 'AI response did not match expected schema',
          code: 'AI_SERVICE_ERROR',
          status: 502,
          details: planParsed.error.flatten().fieldErrors,
        },
        { status: 502 }
      );
    }

    // 8. Return the analysis plan
    return NextResponse.json({ plan: planParsed.data });
  } catch (error) {
    console.error('[POST /api/ai/analyze] Error:', error);

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
