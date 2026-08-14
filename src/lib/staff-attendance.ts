import 'server-only';

import { connectToDatabase } from './db';
import { StaffRecord } from '@/models/StaffRecord';

// Only the three default roles are surfaced on the public frontend.
// Admin-created custom roles are still fully supported internally and
// stored on staff records; they just don't add new frontend categories.
export const STAFF_ROLES = ['Imam', 'Muazzin', 'Khadim'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const PRAYER_ORDER = ['fajr', 'zohar', 'asr', 'maghrib', 'isha'] as const;
export type PrayerKey = (typeof PRAYER_ORDER)[number];

// Attendance is fully manual. Only Present / Absent are ever produced or
// stored. Days without a saved record are simply treated as Absent.
export type AttendanceStatus = 'Present' | 'Absent';

const attendanceFieldByPrayer: Record<PrayerKey, string> = {
  fajr: 'fajrAttendance',
  zohar: 'zoharAttendance',
  asr: 'asrAttendance',
  maghrib: 'maghribAttendance',
  isha: 'ishaAttendance'
};

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function getAppTimeZone() {
  return process.env.APP_TIME_ZONE || 'Asia/Karachi';
}

export function getDateKeyForTimeZone(date: Date, timeZone = getAppTimeZone()) {
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) return date.toISOString().slice(0, 10);
  return `${year}-${month}-${day}`;
}

export function getTodayDateKey() {
  return getDateKeyForTimeZone(new Date());
}

function isDatabaseConfigured() {
  return Boolean(process.env.MONGO_URI);
}

/**
 * Works out the status of one prayer on one day.
 * - An explicit "Present"/"Absent" saved by the admin is always returned as-is.
 * - If nothing was explicitly saved for today, the staff member is assumed
 *   Present by default - Absent only happens when the admin actively marks
 *   it. This does not apply when no one is assigned to the role at all
 *   (hasAssignedStaff: false), since there is no one to default to Present.
 */
export function computePrayerStatus(options: {
  storedValue: AttendanceStatus | string | undefined | null;
  hasAssignedStaff?: boolean;
}): AttendanceStatus {
  const { storedValue, hasAssignedStaff = true } = options;

  if (storedValue === 'Present') return 'Present';
  if (storedValue === 'Absent') return 'Absent';
  return hasAssignedStaff ? 'Present' : 'Absent';
}

type StaffRecordLean = {
  _id: string;
  staffName: string;
  role: string;
  dateKey: string | Date;
  fajrAttendance?: AttendanceStatus;
  zoharAttendance?: AttendanceStatus;
  asrAttendance?: AttendanceStatus;
  maghribAttendance?: AttendanceStatus;
  ishaAttendance?: AttendanceStatus;
  note?: string;
};

function toDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return getDateKeyForTimeZone(date);
}

export type RoleTodayStatus = {
  role: StaffRole;
  staffName: string | null;
  dateKey: string;
  prayers: Record<PrayerKey, AttendanceStatus>;
};

/**
 * Finds who is currently serving each role (whoever has the most recent
 * attendance activity for that role) and computes today's live status
 * for each of the five prayers.
 */
export async function getStaffAttendanceOverview(): Promise<RoleTodayStatus[]> {
  const emptyOverview = STAFF_ROLES.map((role) => ({
    role,
    staffName: null,
    dateKey: getTodayDateKey(),
    prayers: { fajr: 'Absent', zohar: 'Absent', asr: 'Absent', maghrib: 'Absent', isha: 'Absent' } as Record<PrayerKey, AttendanceStatus>
  }));

  if (!isDatabaseConfigured()) return emptyOverview;

  try {
    await connectToDatabase();

    const todayKey = getTodayDateKey();

    const allRecords = await StaffRecord.find().sort({ dateKey: -1, createdAt: -1 }).lean<StaffRecordLean[]>();

    return STAFF_ROLES.map((role) => {
      const roleRecords = allRecords.filter((record) => record.role === role);
      const activeStaffName = roleRecords[0]?.staffName ?? null;

      const todaysRecord = activeStaffName
        ? roleRecords.find((record) => record.staffName.toLowerCase() === activeStaffName.toLowerCase() && toDateKey(record.dateKey) === todayKey)
        : undefined;

      const prayers = PRAYER_ORDER.reduce((acc, prayer) => {
        acc[prayer] = computePrayerStatus({
          storedValue: todaysRecord?.[attendanceFieldByPrayer[prayer] as keyof StaffRecordLean] as AttendanceStatus | undefined,
          hasAssignedStaff: Boolean(activeStaffName)
        });
        return acc;
      }, {} as Record<PrayerKey, AttendanceStatus>);

      return { role, staffName: activeStaffName, dateKey: todayKey, prayers };
    });
  } catch {
    return emptyOverview;
  }
}

export type StaffAttendanceDay = {
  dateKey: string;
  recordId: string | null;
  prayers: Record<PrayerKey, AttendanceStatus>;
  note: string;
};

export type StaffAttendanceMonth = {
  role: StaffRole;
  staffName: string | null;
  month: number;
  year: number;
  days: StaffAttendanceDay[];
  summary: {
    daysCounted: number;
    fajr: number;
    zohar: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
};

/**
 * Builds the full month view for one role: one row per day (up to today
 * for the current month, the whole month otherwise) with live-computed
 * status for every prayer, plus a Present-count summary per prayer.
 */
export async function getStaffAttendanceMonth(role: StaffRole, month: number, year: number): Promise<StaffAttendanceMonth> {
  const empty: StaffAttendanceMonth = {
    role,
    staffName: null,
    month,
    year,
    days: [],
    summary: { daysCounted: 0, fajr: 0, zohar: 0, asr: 0, maghrib: 0, isha: 0 }
  };

  if (!isDatabaseConfigured()) return empty;

  try {
    await connectToDatabase();

    const todayKey = getTodayDateKey();

    const roleRecords = await StaffRecord.find({ role }).sort({ dateKey: -1, createdAt: -1 }).lean<StaffRecordLean[]>();

    if (roleRecords.length === 0) return empty;

    const activeStaffName = roleRecords[0].staffName;
    const staffRecords = roleRecords.filter((record) => record.staffName.toLowerCase() === activeStaffName.toLowerCase());
    const recordsByDate = new Map<string, StaffRecordLean>();
    staffRecords.forEach((record) => {
      recordsByDate.set(toDateKey(record.dateKey), record);
    });

    // The earliest saved date is the day this staff member was actually added.
    // Never show a row for days before that — there is nothing to show and
    // nothing gets auto-filled in.
    const staffDateKeys = staffRecords.map((record) => toDateKey(record.dateKey)).sort();
    const earliestDateKey = staffDateKeys[0];

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const monthKeyPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const isCurrentMonth = todayKey.startsWith(monthKeyPrefix);
    const lastDay = isCurrentMonth ? Number(todayKey.slice(8, 10)) : daysInMonth;
    const isFutureMonth = `${monthKeyPrefix}-01` > todayKey;

    if (isFutureMonth) return empty;

    const days: StaffAttendanceDay[] = [];
    const summary = { daysCounted: 0, fajr: 0, zohar: 0, asr: 0, maghrib: 0, isha: 0 };

    for (let day = 1; day <= lastDay; day += 1) {
      const dateKey = `${monthKeyPrefix}-${String(day).padStart(2, '0')}`;

      // Skip any day before the staff member's actual hire date — there is
      // nothing to show for it.
      if (earliestDateKey && dateKey < earliestDateKey) continue;

      const record = recordsByDate.get(dateKey);

      const prayers = PRAYER_ORDER.reduce((acc, prayer) => {
        const status = computePrayerStatus({
          storedValue: record?.[attendanceFieldByPrayer[prayer] as keyof StaffRecordLean] as AttendanceStatus | undefined,
          hasAssignedStaff: true
        });
        acc[prayer] = status;
        if (status === 'Present') summary[prayer] += 1;
        return acc;
      }, {} as Record<PrayerKey, AttendanceStatus>);

      days.push({
        dateKey,
        recordId: record?._id ? String(record._id) : null,
        prayers,
        note: record?.note ?? ''
      });
      summary.daysCounted += 1;
    }

    days.reverse();

    return serialize({
      role,
      staffName: activeStaffName,
      month,
      year,
      days,
      summary
    });
  } catch {
    return empty;
  }
}
