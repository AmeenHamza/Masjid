import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { AdminUser } from '@/models/AdminUser';
import { adminLoginSchema } from '@/lib/validators';
import { apiError, json } from '@/lib/api';
import { signAuthToken } from '@/lib/jwt';
import { authCookieName } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for') || 'unknown';
  const limit = rateLimit(`login:${ip}`, 8, 60_000);
  if (!limit.allowed) return apiError('Too many login attempts', 429);

  const body = await request.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return apiError('Invalid login payload', 400, parsed.error.flatten());
  }

  await connectToDatabase();
  const user = await AdminUser.findOne({ email: parsed.data.email.toLowerCase() });

  if (!user) {
    return apiError('Invalid credentials', 401);
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordMatches) {
    return apiError('Invalid credentials', 401);
  }

  const token = await signAuthToken({ id: user._id.toString(), email: user.email, role: 'admin' });
  const cookieStore = await cookies();
  cookieStore.set(authCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  return json({ ok: true, user: { id: user._id, email: user.email, name: user.name } });
}
