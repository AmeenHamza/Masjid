import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/public-data';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}
