import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { apiError, json } from '@/lib/api';
import { getServerSession } from '@/lib/auth';
import { resourceMap } from '@/lib/admin-resources';
import { rateLimit } from '@/lib/rate-limit';

type Params = { params: Promise<{ collection: string }> };

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
  const parsed = resource.schema.safeParse(body);

  if (!parsed.success) {
    return apiError('Validation failed', 400, parsed.error.flatten());
  }

  await connectToDatabase();
  const created = await resource.model.create({ ...parsed.data, addedBy: session.id });
  return json({ ok: true, item: created }, { status: 201 });
}
