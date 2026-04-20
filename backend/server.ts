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

const app = express();
const backendPort = Number(process.env.BACKEND_PORT || 5000);
const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

app.post('/api/auth/login', async (req, res) => {
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
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(authCookieName, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', adminAuthMiddleware, (req, res) => {
  const admin = (req as express.Request & { admin?: { id: string; email: string } }).admin;
  res.json({ ok: true, admin });
});

app.get('/api/admin/:collection', adminAuthMiddleware, async (req, res) => {
  const key = req.params.collection as ResourceKey;
  const model = resourceModels[key];

  if (!model) {
    res.status(404).json({ ok: false, message: 'Unknown collection' });
    return;
  }

  const items = await model.find().sort({ createdAt: -1 }).lean();
  res.json({ ok: true, items });
});

app.post('/api/admin/:collection', adminAuthMiddleware, async (req, res) => {
  const key = req.params.collection as ResourceKey;
  const model = resourceModels[key];
  const admin = (req as express.Request & { admin?: { id: string } }).admin;

  if (!model) {
    res.status(404).json({ ok: false, message: 'Unknown collection' });
    return;
  }

  const created = await model.create({ ...req.body, addedBy: admin?.id });
  res.status(201).json({ ok: true, item: created });
});

app.patch('/api/admin/:collection/:id', adminAuthMiddleware, async (req, res) => {
  const key = req.params.collection as ResourceKey;
  const model = resourceModels[key];
  const admin = (req as express.Request & { admin?: { id: string } }).admin;

  if (!model) {
    res.status(404).json({ ok: false, message: 'Unknown collection' });
    return;
  }

  const updated = await model.findByIdAndUpdate(req.params.id, { ...req.body, addedBy: admin?.id }, { new: true });
  res.json({ ok: true, item: updated });
});

app.delete('/api/admin/:collection/:id', adminAuthMiddleware, async (req, res) => {
  const key = req.params.collection as ResourceKey;
  const model = resourceModels[key];

  if (!model) {
    res.status(404).json({ ok: false, message: 'Unknown collection' });
    return;
  }

  await model.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected backend error';
  res.status(500).json({ ok: false, message });
});

async function start() {
  await connectBackendDb();
  await ensureDefaultAdmin();

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
