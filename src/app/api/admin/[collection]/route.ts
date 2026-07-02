import { headers } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { apiError, json } from '@/lib/api';
import { getServerSession } from '@/lib/auth';
import { resourceMap } from '@/lib/admin-resources';
import { rateLimit } from '@/lib/rate-limit';
import { minutesToCanonical24, parsePrayerTimeToMinutes } from '@/lib/prayer-activity';

type Params = { params: Promise<{ collection: string }> };

function normalizePrayerTimesBody(body: Record<string, unknown>) {
  const requiredKeys = ['fajr', 'zohar', 'asr', 'maghrib', 'isha'] as const;
  const optionalKeys = ['juma'] as const;

  for (const key of requiredKeys) {
    const value = body[key];
    const minutes = parsePrayerTimeToMinutes(typeof value === 'string' ? value : '');
    if (minutes === null) {
      return { ok: false as const, message: `Invalid ${key} time. Use 4:15 PM or 16:15.` };
    }
    body[key] = minutesToCanonical24(minutes);
  }

  for (const key of optionalKeys) {
    const raw = String(body[key] ?? '').trim();
    if (!raw) {
      body[key] = '';
      continue;
    }
    const minutes = parsePrayerTimeToMinutes(raw);
    if (minutes === null) {
      return { ok: false as const, message: `Invalid ${key} time. Use 1:30 PM or 13:30.` };
    }
    body[key] = minutesToCanonical24(minutes);
  }

  return { ok: true as const };
}

export async function GET(_request: Request, { params }: Params) {
  const { collection } = await params;
  const resource = resourceMap[collection as keyof typeof resourceMap];

  if (!resource) return apiError('Unknown collection', 404);

  const session = await getServerSession();
  if (!session) return apiError('Unauthorized', 401);

  await connectToDatabase();
    const items = await (collection === 'shop-records'
      ? resource.model.find().sort({ year: -1, month: -1, date: -1, createdAt: -1 }).lean()
      : resource.model.find().sort({ createdAt: -1 }).lean());
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
  if (!body || typeof body !== 'object') {
    return apiError('Invalid request body', 400);
  }

  if (collection === 'staff-records') {
    const candidate = body as Record<string, unknown>;
    const rawDateKey = candidate.dateKey;
    if (rawDateKey == null || String(rawDateKey).trim() === '') {
      delete candidate.dateKey;
    }
  }

  if (collection === 'prayer-times') {
    const normalized = normalizePrayerTimesBody(body as Record<string, unknown>);
    if (!normalized.ok) {
      return apiError(normalized.message, 400);
    }
  }

  if (collection === 'income-records') {
    const candidate = body as Record<string, unknown>;
    if (candidate.date == null || String(candidate.date).trim() === '') {
      candidate.date = new Date().toISOString().slice(0, 10);
    }
  }

  // 👇 YEH VALA CODE AAPNE BILKUL ISKE NICHE ADD KARNA HAI 👇
  if (collection === 'rent-records') {
    const candidate = body as Record<string, unknown>;
    if (candidate.receivedDate == null || String(candidate.receivedDate).trim() === '') {
      candidate.receivedDate = new Date().toISOString().slice(0, 10);
    }
  }

  const parsed = resource.schema.safeParse(body);

  if (!parsed.success) {
    return apiError('Validation failed', 400, parsed.error.flatten());
  }

  await connectToDatabase();

  if (collection === 'staff-records') {
    const input = parsed.data as { staffName: string; role: string; dateKey: Date };
    const currentDate = new Date(input.dateKey);
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const duplicate = await resource.model.findOne({
      staffName: input.staffName,
      role: input.role,
      dateKey: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    if (duplicate) {
      return apiError('Attendance for this staff and date is already added. Please edit existing record.', 409);
    }
  }

  if (collection === 'shop-records') {
    const input = parsed.data as {
      shopName: string;
      ownerName: string;
      month: number;
      year: number;
      paymentStatus: 'Clear' | 'Due' | 'Partial';
      paymentAmount: number;
      monthlyRent: number;
      debtAmount: number;
      buyDate?: string | Date;
      rentHistory?: Record<string, Record<string, unknown>>;
    };

    const shopName = String(input.shopName ?? '').trim();
    const ownerName = String(input.ownerName ?? '').trim();
    const month = Number(input.month ?? 0);
    const year = Number(input.year ?? 0);
    const currentMonthlyRent = Number(input.monthlyRent ?? 0);
    const paidAmount = Number(input.paymentAmount ?? 0);

    if (!shopName || !ownerName) {
      return apiError('Shop name and owner name are required.', 400);
    }

    const shopQuery = {
      shopName: { $regex: `^${shopName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      ownerName: { $regex: `^${ownerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    };

    const buyDate = input.buyDate ? new Date(String(input.buyDate)) : new Date();
    if (!Number.isNaN(buyDate.getTime())) {
      const startMonth = buyDate.getMonth() + 1;
      const startYear = buyDate.getFullYear();
      if (year < startYear || (year === startYear && month < startMonth)) {
        return apiError('Selected month/year cannot be before the property start date.', 400);
      }
    }

    const duplicate = await resource.model.findOne({
      ...shopQuery,
      month,
      year
    }).lean();

    if (duplicate) {
      return apiError(`A payment record for ${shopName} already exists for ${new Date(0, month - 1).toLocaleString('en-US', { month: 'long' })} ${year}.`, 409);
    }

    const priorRecords = await resource.model.find({
      ...shopQuery,
      $or: [
        { year: { $lt: year } },
        { year, month: { $lt: month } }
      ]
    }).sort({ year: 1, month: 1, createdAt: 1 }).lean() as Array<Record<string, unknown>>;

    const rentHistoryEntries: Record<string, Record<string, unknown>> = {};

    priorRecords.forEach((record) => {
      const recordMonth = Number(record.month ?? 0);
      const recordYear = Number(record.year ?? 0);
      const key = `${recordYear}-${String(recordMonth).padStart(2, '0')}`;
      rentHistoryEntries[key] = {
        month: recordMonth,
        year: recordYear,
        rentAmount: Number(record.monthlyRent ?? 0),
        paidAmount: Number(record.paymentAmount ?? 0),
        remainingBalance: Number(record.debtAmount ?? 0),
        status: String(record.paymentStatus ?? 'Due'),
        paymentDate: String(record.date ?? record.buyDate ?? '')
      };
    });

    const currentKey = `${year}-${String(month).padStart(2, '0')}`;
    rentHistoryEntries[currentKey] = {
      month,
      year,
      rentAmount: currentMonthlyRent,
      paidAmount: 0,
      remainingBalance: currentMonthlyRent,
      status: 'Due',
      paymentDate: new Date().toISOString().slice(0, 10)
    };

    const sortedHistoryKeys = Object.keys(rentHistoryEntries).sort((a, b) => a.localeCompare(b));
    let remainingPayment = paidAmount;

    sortedHistoryKeys.forEach((key) => {
      const entry = rentHistoryEntries[key];
      const rentAmount = Number(entry.rentAmount ?? 0);
      const currentPaid = Number(entry.paidAmount ?? 0);
      const outstanding = Math.max(0, rentAmount - currentPaid);

      if (outstanding <= 0 || remainingPayment <= 0) {
        return;
      }

      const appliedAmount = Math.min(outstanding, remainingPayment);
      const nextPaid = currentPaid + appliedAmount;
      const nextBalance = Math.max(0, rentAmount - nextPaid);
      entry.paidAmount = nextPaid;
      entry.remainingBalance = nextBalance;
      entry.status = nextBalance === 0 ? 'Clear' : nextPaid > 0 ? 'Partial' : 'Due';
      entry.paymentDate = String(entry.paymentDate || new Date().toISOString().slice(0, 10));
      remainingPayment = Math.max(0, remainingPayment - appliedAmount);
    });

    const currentEntry = rentHistoryEntries[currentKey] as Record<string, unknown>;
    const currentBalance = Number(currentEntry.remainingBalance ?? 0);
    const currentStatus = currentBalance === 0 ? 'Clear' : (Number(currentEntry.paidAmount ?? 0) > 0 ? 'Partial' : 'Due');

    (parsed.data as Record<string, unknown>).monthlyRent = currentMonthlyRent;
    (parsed.data as Record<string, unknown>).debtAmount = currentBalance;
    (parsed.data as Record<string, unknown>).paymentAmount = Number(currentEntry.paidAmount ?? 0);
    (parsed.data as Record<string, unknown>).paymentStatus = currentStatus;
    (parsed.data as Record<string, unknown>).rentHistory = rentHistoryEntries;
  }

  try {
    const created = await resource.model.create({ ...parsed.data, addedBy: session.id });
    return json({ ok: true, item: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create record';
    return apiError(message, 400);
  }
}
