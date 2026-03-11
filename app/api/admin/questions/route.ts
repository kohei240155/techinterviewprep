import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { bulkSaveQuestionsRequestSchema } from '@/types';
import type { BulkSaveQuestionsResponse } from '@/types';

const checkAdmin = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return null;
  }
  return user;
};

export async function GET(request: NextRequest) {
  try {
    const user = await checkAdmin();
    if (!user) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN', status: 403 },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const topic_id = searchParams.get('topic_id');
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const offset = (page - 1) * limit;

    let query = getAdminClient()
      .from('questions')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (topic_id) {
      query = query.eq('topic_id', topic_id);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message, code: 'INTERNAL_SERVER_ERROR', status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_SERVER_ERROR', status: 500 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await checkAdmin();
    if (!user) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN', status: 403 },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = bulkSaveQuestionsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          status: 400,
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { topic_id, questions } = parsed.data;

    const rows = questions.map((q) => ({
      topic_id,
      type: q.type,
      difficulty: q.difficulty,
      question_ja: q.question_ja,
      question_en: q.question_en,
      options: q.options as Record<string, unknown> | Record<string, unknown>[] | null,
      answer: q.answer as Record<string, unknown>,
      explanation_ja: q.explanation_ja,
      explanation_en: q.explanation_en,
    }));

    const { data, error } = await getAdminClient()
      .from('questions')
      .insert(rows)
      .select('id');

    if (error) {
      return NextResponse.json(
        { error: error.message, code: 'INTERNAL_SERVER_ERROR', status: 500 },
        { status: 500 }
      );
    }

    const response: BulkSaveQuestionsResponse = {
      inserted_count: data.length,
      question_ids: data.map((row) => row.id),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_SERVER_ERROR', status: 500 },
      { status: 500 }
    );
  }
}
