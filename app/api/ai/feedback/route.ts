import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: Grok API で口頭説明フィードバック
  return NextResponse.json({ error: 'Not implemented', code: 'NOT_IMPLEMENTED', status: 501 }, { status: 501 });
}
