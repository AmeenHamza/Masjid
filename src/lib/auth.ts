import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { backendApiUrl } from './backend-url';

const TOKEN_COOKIE = 'jm_auth';

export async function getServerSession() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${backendApiUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: `${TOKEN_COOKIE}=${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { ok: boolean; admin?: { id: string; email: string; role: 'admin' } };
    return data.admin ?? null;
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
