import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { feedbackRequestSchema } from '@/types';
import { adminClient } from '@/lib/supabase/admin';
import { buildFeedbackPrompt } from '@/lib/prompts/feedback';
import { FeedbackSchema } from '@/lib/prompts/schemas';
import type { ExplainRubric, ExplainAnswer } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = feedbackRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'VALIDATION_ERROR', status: 400 },
        { status: 400 }
      );
    }

    const { question_id, user_answer, language } = parsed.data;

    const { data: question, error: dbError } = await adminClient
      .from('questions')
      .select('*')
      .eq('id', question_id)
      .single();

    if (dbError || !question) {
      return NextResponse.json(
        { error: 'Question not found', code: 'NOT_FOUND', status: 404 },
        { status: 404 }
      );
    }

    const options = question.options as ExplainRubric;
    const answer = question.answer as ExplainAnswer;

    const rubric = language === 'ja' ? options.rubric_ja : options.rubric_en;
    const modelAnswer = language === 'ja' ? answer.model_answer_ja : answer.model_answer_en;
    const questionText = language === 'ja' ? question.question_ja : question.question_en;

    const prompt = buildFeedbackPrompt({
      language,
      rubric,
      modelAnswer,
      question: questionText,
      userAnswer: user_answer,
    });

    const grok = new OpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: process.env.XAI_API_KEY,
    });

    const completion = await grok.beta.chat.completions.parse({
      model: 'grok-3',
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      response_format: zodResponseFormat(FeedbackSchema, 'feedback'),
    });

    const result = completion.choices[0].message.parsed;

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to parse AI response', code: 'AI_SERVICE_ERROR', status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ rating: result.rating, feedback: result.feedback });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Feedback generation failed', code: 'AI_SERVICE_ERROR', status: 500 },
      { status: 500 }
    );
  }
}
