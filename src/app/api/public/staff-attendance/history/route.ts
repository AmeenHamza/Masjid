import { json, apiError } from '@/lib/api';
import { getStaffAttendanceMonth, STAFF_ROLES, type StaffRole } from '@/lib/staff-attendance';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get('role') as StaffRole | null;
  const now = new Date();
  const month = Number(url.searchParams.get('month') ?? now.getMonth() + 1);
  const year = Number(url.searchParams.get('year') ?? now.getFullYear());

  if (!role || !STAFF_ROLES.includes(role)) {
    return apiError('Invalid or missing role. Use Imam, Muazzin or Khadim.', 400);
  }

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    return apiError('Invalid month/year.', 400);
  }

  const data = await getStaffAttendanceMonth(role, month, year);
  return json({ ok: true, ...data });
}
