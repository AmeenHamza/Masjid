import { NextResponse } from 'next/server';

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function apiError(message: string, status = 400, details?: unknown) {
  return json({ ok: false, message, details }, { status });
}
