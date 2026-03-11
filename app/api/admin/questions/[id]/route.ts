import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { updateQuestionRequestSchema } from '@/types';
import type { UpdateQuestionResponse } from '@/types';

const checkAdmin = async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return null;
  }
  return user;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAdmin();
    if (!user) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN', status: 403 },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateQuestionRequestSchema.safeParse(body);

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

    const updateData: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() };
    if (parsed.data.options !== undefined) {
      updateData.options = parsed.data.options as Record<string, unknown> | Record<string, unknown>[] | null;
    }
    if (parsed.data.answer !== undefined) {
      updateData.answer = parsed.data.answer as Record<string, unknown>;
    }

    const { data, error } = await getAdminClient()
      .from('questions')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Question not found', code: 'NOT_FOUND', status: 404 },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message, code: 'INTERNAL_SERVER_ERROR', status: 500 },
        { status: 500 }
      );
    }

    const response: UpdateQuestionResponse = { question: data };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_SERVER_ERROR', status: 500 },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAdmin();
    if (!user) {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN', status: 403 },
        { status: 403 }
      );
    }

    const { id } = await params;

    const { error } = await getAdminClient()
      .from('questions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) {
      return NextResponse.json(
        { error: error.message, code: 'INTERNAL_SERVER_ERROR', status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: message, code: 'INTERNAL_SERVER_ERROR', status: 500 },
      { status: 500 }
    );
  }
}
