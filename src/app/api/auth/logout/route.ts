import { cookies } from 'next/headers';
import { json } from '@/lib/api';
import { authCookieName } from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(authCookieName(), '', { httpOnly: true, path: '/', maxAge: 0 });
  return json({ ok: true });
}
