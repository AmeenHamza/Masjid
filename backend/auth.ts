import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import type { Request, Response, NextFunction } from 'express';
import { AdminUser } from './models';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');

type AuthPayload = {
  id: string;
  email: string;
  role: 'admin';
};

export const authCookieName = 'jm_auth';

export async function signToken(payload: AuthPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as AuthPayload;
}

export async function ensureDefaultAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL || 'admin@masjid.com';
  const password = process.env.ADMIN_SEED_PASSWORD || 'admin123';
  const existing = await AdminUser.findOne({ email });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);
  await AdminUser.create({
    name: 'Masjid Admin',
    email,
    passwordHash,
    role: 'admin'
  });
}

export async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[authCookieName];
  if (!token) {
    res.status(401).json({ ok: false, message: 'Unauthorized' });
    return;
  }

  try {
    const payload = await verifyToken(token);
    (req as Request & { admin?: AuthPayload }).admin = payload;
    next();
  } catch {
    res.status(401).json({ ok: false, message: 'Invalid token' });
  }
}
