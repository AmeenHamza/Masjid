import { connectToDatabase } from '@/lib/db';
import { apiError, json } from '@/lib/api';
import { getServerSession } from '@/lib/auth';
import { StaffRecord } from '@/models/StaffRecord';

export const dynamic = 'force-dynamic';

// Returns the distinct list of every staff member ever saved, along with
// their most recent role. Used by the admin attendance form's searchable
// staff dropdown so it always reflects the current database.
export async function GET() {
  const session = await getServerSession();
  if (!session) return apiError('Unauthorized', 401);

  await connectToDatabase();

  const records = await StaffRecord.find({}, { staffName: 1, role: 1, dateKey: 1, createdAt: 1 })
    .sort({ dateKey: -1, createdAt: -1 })
    .lean<Array<{ staffName?: string; role?: string; dateKey?: Date; createdAt?: Date }>>();

  const seen = new Map<string, { staffName: string; role: string }>();
  for (const record of records) {
    const staffName = String(record.staffName ?? '').trim();
    const role = String(record.role ?? '').trim();
    if (!staffName) continue;
    const key = staffName.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, { staffName, role });
    }
  }

  const items = Array.from(seen.values()).sort((a, b) => a.staffName.localeCompare(b.staffName));
  return json({ ok: true, items });
}
