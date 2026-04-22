import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { apiError, json } from '@/lib/api';
import { getServerSession } from '@/lib/auth';
import { resourceMap } from '@/lib/admin-resources';
import { rateLimit } from '@/lib/rate-limit';
import { minutesToCanonical24, parsePrayerTimeToMinutes } from '@/lib/prayer-activity';

type Params = { params: Promise<{ collection: string }> };

function normalizePrayerTimesBody(body: Record<string, unknown>) {
  const requiredKeys = ['fajr', 'zohar', 'asr', 'maghrib', 'isha'] as const;
  const optionalKeys = ['juma'] as const;

  for (const key of requiredKeys) {
    const value = body[key];
    const minutes = parsePrayerTimeToMinutes(typeof value === 'string' ? value : '');
    if (minutes === null) {
      return { ok: false as const, message: `Invalid ${key} time. Use 4:15 PM or 16:15.` };
    }
    body[key] = minutesToCanonical24(minutes);
  }

  for (const key of optionalKeys) {
    const raw = String(body[key] ?? '').trim();
    if (!raw) {
      body[key] = '';
      continue;
    }
    const minutes = parsePrayerTimeToMinutes(raw);
    if (minutes === null) {
      return { ok: false as const, message: `Invalid ${key} time. Use 1:30 PM or 13:30.` };
    }
    body[key] = minutesToCanonical24(minutes);
  }

  return { ok: true as const };
}

export async function GET(_request: Request, { params }: Params) {
  const { collection } = await params;
  const resource = resourceMap[collection as keyof typeof resourceMap];

  if (!resource) return apiError('Unknown collection', 404);

  const session = await getServerSession();
  if (!session) return apiError('Unauthorized', 401);

  await connectToDatabase();
  const items = await resource.model.find().sort({ createdAt: -1 }).lean();
  return json({ ok: true, items });
}

export async function POST(request: Request, { params }: Params) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || 'unknown';
  const limit = rateLimit(`admin-post:${ip}`, 60, 60_000);
  if (!limit.allowed) return apiError('Rate limit exceeded', 429);

  const { collection } = await params;
  const resource = resourceMap[collection as keyof typeof resourceMap];
  if (!resource) return apiError('Unknown collection', 404);

  const session = await getServerSession();
  if (!session) return apiError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return apiError('Invalid request body', 400);
  }

  if (collection === 'prayer-times') {
    const normalized = normalizePrayerTimesBody(body as Record<string, unknown>);
    if (!normalized.ok) {
      return apiError(normalized.message, 400);
    }
  }

  const parsed = resource.schema.safeParse(body);

  if (!parsed.success) {
    return apiError('Validation failed', 400, parsed.error.flatten());
  }

  await connectToDatabase();
  const created = await resource.model.create({ ...parsed.data, addedBy: session.id });
  return json({ ok: true, item: created }, { status: 201 });
}
