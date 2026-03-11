import { NextResponse } from 'next/server';

export async function POST() {
  // TODO: Whisper API で音声文字起こし
  return NextResponse.json({ error: 'Not implemented', code: 'NOT_IMPLEMENTED', status: 501 }, { status: 501 });
}
