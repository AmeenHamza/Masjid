import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { apiError, json } from '@/lib/api';
import { getServerSession } from '@/lib/auth';
import { CustomRole } from '@/models/CustomRole';
import { customRoleSchema } from '@/lib/validators';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const DEFAULT_ROLES = ['Imam', 'Muazzin', 'Khadim'];

// GET: returns every role (built-in + any admin-created custom role).
// Used by all role dropdowns in the admin UI so they stay in sync
// whenever a new role is added.
export async function GET() {
  const session = await getServerSession();
  if (!session) return apiError('Unauthorized', 401);

  await connectToDatabase();
  const custom = await CustomRole.find({}, { name: 1 }).sort({ name: 1 }).lean<Array<{ name?: string }>>();

  const seen = new Set<string>();
  const roles: string[] = [];
  for (const name of [...DEFAULT_ROLES, ...custom.map((entry) => String(entry.name ?? '').trim())]) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    roles.push(trimmed);
  }

  return json({ ok: true, roles, defaults: DEFAULT_ROLES });
}

// POST: creates a new custom role. Rejects duplicates (case-insensitive)
// and the built-in role names, so the dropdown stays clean.
export async function POST(request: Request) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || 'unknown';
  const limit = rateLimit(`role-post:${ip}`, 30, 60_000);
  if (!limit.allowed) return apiError('Rate limit exceeded', 429);

  const session = await getServerSession();
  if (!session) return apiError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = customRoleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Please enter a valid role name.', 400, parsed.error.flatten());
  }

  const name = parsed.data.name.trim();
  const lowered = name.toLowerCase();
  if (DEFAULT_ROLES.some((role) => role.toLowerCase() === lowered)) {
    return apiError('This role already exists.', 409);
  }

  await connectToDatabase();
  const existing = await CustomRole.findOne({ name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }).lean();
  if (existing) {
    return apiError('This role already exists.', 409);
  }

  try {
    const created = await CustomRole.create({ name, addedBy: session.id });
    return json({ ok: true, item: created }, { status: 201 });
  } catch {
    return apiError('Unable to create role. Please try again.', 400);
  }
}
