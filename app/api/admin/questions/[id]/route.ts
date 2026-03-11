import { NextResponse } from 'next/server';

export async function PUT() {
  // TODO: 問題個別更新
  return NextResponse.json({ error: 'Not implemented', code: 'NOT_IMPLEMENTED', status: 501 }, { status: 501 });
}

export async function DELETE() {
  // TODO: 問題削除（論理削除）
  return NextResponse.json({ error: 'Not implemented', code: 'NOT_IMPLEMENTED', status: 501 }, { status: 501 });
}
