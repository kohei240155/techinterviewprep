import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: Claude API で問題生成
  return NextResponse.json({ error: 'Not implemented', code: 'NOT_IMPLEMENTED', status: 501 }, { status: 501 });
}
