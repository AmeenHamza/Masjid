import { json } from '@/lib/api';
import { getStaffAttendanceOverview } from '@/lib/staff-attendance';

export const dynamic = 'force-dynamic';

export async function GET() {
  const roles = await getStaffAttendanceOverview();
  return json({ ok: true, roles });
}
