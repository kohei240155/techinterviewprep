import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { chatRequestSchema } from '@/types';
import { adminClient } from '@/lib/supabase/admin';
import { buildChatPrompt } from '@/lib/prompts/chat';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', code: 'VALIDATION_ERROR', status: 400 },
        { status: 400 }
      );
    }

    const { topic_id, message, language, history } = parsed.data;

    const { data: topic, error: topicError } = await adminClient
      .from('topics')
      .select('name_ja, name_en')
      .eq('id', topic_id)
      .single();

    if (topicError || !topic) {
      return NextResponse.json(
        { error: 'Topic not found', code: 'NOT_FOUND', status: 404 },
        { status: 404 }
      );
    }

    const topicName = language === 'ja' ? topic.name_ja : topic.name_en;
    const prompt = buildChatPrompt({ topic: topicName, language, userQuestion: message });

    const grok = new OpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: process.env.XAI_API_KEY,
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system' as const, content: prompt.system },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: prompt.user },
    ];

    const completion = await grok.chat.completions.create({
      model: 'grok-3',
      messages,
    });

    const reply = completion.choices[0]?.message?.content ?? '';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'AI service error', code: 'AI_SERVICE_ERROR', status: 500 },
      { status: 500 }
    );
  }
}
