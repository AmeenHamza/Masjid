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
    const payload = await verifyAuthToken(token);
    if (payload.role !== 'admin') {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const session = await getServerSession();
  if (!session) {
    redirect('/admin/login');
  }
  return session;
}

export function authCookieName() {
  return TOKEN_COOKIE;
}
