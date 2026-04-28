import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { connectBackendDb } from './db';
import { AdminUser, resourceModels, type ResourceKey } from './models';
import { adminAuthMiddleware, authCookieName, ensureDefaultAdmin, signToken } from './auth';
import { ensureDefaultContent } from './seed';

const app = express();
const backendPort = Number(process.env.BACKEND_PORT || 5000);
const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const asyncHandler = (
  handler: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>
): express.RequestHandler => {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
};

function parsePrayerTimeToMinutes(value: unknown): number | null {
  const text = String(value ?? '').trim();
  if (!text) return null;

  const match = /^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/.exec(text);
  if (!match) return null;

  const rawHour = Number(match[1]);
  const minute = Number(match[2]);
  const suffix = match[3]?.toUpperCase();

  if (!Number.isInteger(rawHour) || !Number.isInteger(minute)) return null;
  if (minute < 0 || minute > 59) return null;

  if (suffix) {
    if (rawHour < 1 || rawHour > 12) return null;
    const normalizedHour = rawHour % 12;
    const hour24 = suffix === 'PM' ? normalizedHour + 12 : normalizedHour;
    return hour24 * 60 + minute;
  }

  if (rawHour < 0 || rawHour > 23) return null;
  return rawHour * 60 + minute;
}

function toCanonical24(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function normalizePrayerPayload(payload: Record<string, unknown>) {
  const requiredKeys = ['fajr', 'zohar', 'asr', 'maghrib', 'isha'] as const;
  const optionalKeys = ['juma'] as const;

  for (const key of requiredKeys) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
    const minutes = parsePrayerTimeToMinutes(payload[key]);
    if (minutes === null) {
      return { ok: false as const, message: `Invalid ${key} time. Use e.g. 4:15 PM or 16:15` };
    }
    payload[key] = toCanonical24(minutes);
  }

  for (const key of optionalKeys) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
    const value = String(payload[key] ?? '').trim();
    if (!value) {
      payload[key] = '';
      continue;
    }

    const minutes = parsePrayerTimeToMinutes(value);
    if (minutes === null) {
      return { ok: false as const, message: `Invalid ${key} time. Use e.g. 1:30 PM or 13:30` };
    }
    payload[key] = toCanonical24(minutes);
  }

  return { ok: true as const };
}

function normalizeShopPayload(payload: Record<string, unknown>) {
  if (Object.prototype.hasOwnProperty.call(payload, 'shopName')) {
    payload.shopName = String(payload.shopName ?? '').trim();
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'ownerName')) {
    payload.ownerName = String(payload.ownerName ?? '').trim();
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'contactNumber')) {
    payload.contactNumber = String(payload.contactNumber ?? '').trim();
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'buyDate')) {
    const date = new Date(String(payload.buyDate ?? ''));
    if (Number.isNaN(date.getTime())) {
      return { ok: false as const, message: 'Invalid buy date' };
    }
    payload.buyDate = date;
  }

  for (const key of ['buyRate', 'debtAmount', 'monthlyRent', 'monthsDue'] as const) {
    if (!Object.prototype.hasOwnProperty.call(payload, key)) {
      continue;
    }

    const value = Number(payload[key]);
    if (Number.isNaN(value)) {
      return { ok: false as const, message: `Invalid ${key}` };
    }
    payload[key] = value;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'paymentStatus')) {
    const paymentStatus = String(payload.paymentStatus ?? 'Clear').trim();
    payload.paymentStatus = paymentStatus || 'Clear';
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'note')) {
    payload.note = String(payload.note ?? '').trim();
  }

  if (!payload.monthsDue) {
    payload.monthsDue = 0;
  }

  if (!payload.paymentStatus) {
    payload.paymentStatus = 'Clear';
  }

  return { ok: true as const };
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (origin === frontendUrl || /^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'masjid-express-backend' });
});

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const email = String(req.body?.email || '').toLowerCase().trim();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    res.status(400).json({ ok: false, message: 'Email and password are required' });
    return;
  }

  const admin = await AdminUser.findOne({ email });
  if (!admin) {
    res.status(401).json({ ok: false, message: 'Invalid credentials' });
    return;
  }

  const match = await bcrypt.compare(password, admin.passwordHash);
  if (!match) {
    res.status(401).json({ ok: false, message: 'Invalid credentials' });
    return;
  }

  const token = await signToken({ id: admin._id.toString(), email: admin.email, role: 'admin' });

  res.cookie(authCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7
  });

  res.json({ ok: true, user: { email: admin.email, name: admin.name } });
}));

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(authCookieName, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', adminAuthMiddleware, (req, res) => {
  const admin = (req as express.Request & { admin?: { id: string; email: string } }).admin;
  res.json({ ok: true, admin });
});

app.get('/api/admin/:collection', adminAuthMiddleware, asyncHandler(async (req, res) => {
  const key = req.params.collection as ResourceKey;
  const model = resourceModels[key];

  if (!model) {
    res.status(404).json({ ok: false, message: 'Unknown collection' });
    return;
  }

  if (key === 'settings') {
    const latest = await model.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean();
    res.json({ ok: true, items: latest ? [latest] : [] });
    return;
  }

  const items = await model.find().sort({ createdAt: -1 }).lean();
  res.json({ ok: true, items });
}));

app.post('/api/admin/:collection', adminAuthMiddleware, asyncHandler(async (req, res) => {
  const key = req.params.collection as ResourceKey;
  const model = resourceModels[key];
  const admin = (req as express.Request & { admin?: { id: string } }).admin;

  if (!model) {
    res.status(404).json({ ok: false, message: 'Unknown collection' });
    return;
  }

  const payload = { ...req.body, addedBy: admin?.id };

  if (key === 'prayer-times') {
    const normalized = normalizePrayerPayload(payload);
    if (!normalized.ok) {
      res.status(400).json({ ok: false, message: normalized.message });
      return;
    }
  }

  if (key === 'gallery') {
    const mediaUrl = String(payload.url || '').trim();
    if (!mediaUrl) {
      res.status(400).json({ ok: false, message: 'Gallery image URL is required' });
      return;
    }
    if (!payload.mediaType) {
      payload.mediaType = 'image';
    }
  }

  if (key === 'hero-slides') {
    const imageUrl = String(payload.imageUrl || '').trim();
    if (!imageUrl) {
      res.status(400).json({ ok: false, message: 'Hero image URL is required' });
      return;
    }
  }

  if (key === 'shop-records') {
    const normalized = normalizeShopPayload(payload);
    if (!normalized.ok) {
      res.status(400).json({ ok: false, message: normalized.message });
      return;
    }
  }

  if (key === 'settings') {
    const existing = await model.findOne().sort({ updatedAt: -1, createdAt: -1 });
    if (existing) {
      existing.set(payload);
      await existing.save();
      res.json({ ok: true, item: existing });
      return;
    }
  }

  if (key === 'prayer-times' && req.body?.dateKey) {
    const upserted = await model.findOneAndUpdate(
      { dateKey: req.body.dateKey },
      payload,
      { upsert: true, new: true }
    );
    res.status(201).json({ ok: true, item: upserted });
    return;
  }

  const created = await model.create(payload);
  res.status(201).json({ ok: true, item: created });
}));

app.patch('/api/admin/:collection/:id', adminAuthMiddleware, asyncHandler(async (req, res) => {
  const key = req.params.collection as ResourceKey;
  const model = resourceModels[key];
  const admin = (req as express.Request & { admin?: { id: string } }).admin;

  if (!model) {
    res.status(404).json({ ok: false, message: 'Unknown collection' });
    return;
  }

  const payload = { ...req.body, addedBy: admin?.id };

  if (key === 'prayer-times') {
    const normalized = normalizePrayerPayload(payload);
    if (!normalized.ok) {
      res.status(400).json({ ok: false, message: normalized.message });
      return;
    }
  }

  if (key === 'gallery' && Object.prototype.hasOwnProperty.call(payload, 'url')) {
    const mediaUrl = String(payload.url || '').trim();
    if (!mediaUrl) {
      res.status(400).json({ ok: false, message: 'Gallery image URL is required' });
      return;
    }
  }

  if (key === 'hero-slides' && Object.prototype.hasOwnProperty.call(payload, 'imageUrl')) {
    const imageUrl = String(payload.imageUrl || '').trim();
    if (!imageUrl) {
      res.status(400).json({ ok: false, message: 'Hero image URL is required' });
      return;
    }
  }

  if (key === 'shop-records') {
    const normalized = normalizeShopPayload(payload);
    if (!normalized.ok) {
      res.status(400).json({ ok: false, message: normalized.message });
      return;
    }
  }

  const updated = await model.findByIdAndUpdate(req.params.id, payload, { new: true });
  res.json({ ok: true, item: updated });
}));

app.delete('/api/admin/:collection/:id', adminAuthMiddleware, asyncHandler(async (req, res) => {
  const key = req.params.collection as ResourceKey;
  const model = resourceModels[key];

  if (!model) {
    res.status(404).json({ ok: false, message: 'Unknown collection' });
    return;
  }

  await model.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error && typeof error === 'object') {
    const name = 'name' in error ? String((error as { name?: unknown }).name || '') : '';
    if (name === 'ValidationError' || name === 'CastError') {
      res.status(400).json({ ok: false, message: 'Validation failed', details: error });
      return;
    }
  }

  const message = error instanceof Error ? error.message : 'Unexpected backend error';
  res.status(500).json({ ok: false, message });
});

async function start() {
  await connectBackendDb();
  await ensureDefaultAdmin();
  await ensureDefaultContent();

  app.listen(backendPort, () => {
    // eslint-disable-next-line no-console
    console.log(`Express backend running on http://localhost:${backendPort}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
