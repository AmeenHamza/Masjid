import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken } from './jwt';

const TOKEN_COOKIE = 'jm_auth';

export async function getServerSession() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getServerSession();
  if (!session) {
    redirect('/en/admin/login');
  }
  return session;
}

export function authCookieName() {
  return TOKEN_COOKIE;
}
