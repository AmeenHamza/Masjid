export type PrayerKey = 'fajr' | 'zohar' | 'asr' | 'maghrib' | 'isha' | 'juma';

type PrayerMap = Record<string, string>;

type PrayerSlot = {
  key: PrayerKey;
  minuteOfDay: number;
};

export type PrayerTimeParts = {
  time: string;
  period: string;
};

export function parsePrayerTimeToMinutes(value: string | number | undefined): number | null {
  if (value === undefined || value === null) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const match = /^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/.exec(trimmed);
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

export function minutesToCanonical24(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatPrayerTime(value: string | number | undefined, locale: string): string {
  void locale;
  const parts = formatPrayerTimeParts(value);
  return parts.period ? `${parts.time} ${parts.period}` : parts.time;
}

export function formatPrayerTimeParts(value: string | number | undefined): PrayerTimeParts {
  const minutes = parsePrayerTimeToMinutes(value);
  if (minutes === null) {
    return {
      time: String(value ?? '--:--'),
      period: ''
    };
  }

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const date = new Date(Date.UTC(2000, 0, 1, hour, minute));

  const dtf = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  });

  const formattedParts = dtf.formatToParts(date);
  const hourPart = formattedParts.find((part) => part.type === 'hour')?.value ?? '';
  const minutePart = formattedParts.find((part) => part.type === 'minute')?.value ?? '00';
  const dayPeriod = (formattedParts.find((part) => part.type === 'dayPeriod')?.value ?? '').toUpperCase();

  return {
    time: `${hourPart}:${minutePart}`,
    period: dayPeriod
  };
}

function getCurrentMinuteAndFriday(now: Date, timeZone: string) {
  const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(now);

  const [hourPart, minutePart] = clock.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short'
  }).format(now);

  return {
    minuteOfDay: (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
    isFriday: weekday.toLowerCase() === 'fri'
  };
}

export function getActivePrayerKey(prayers: PrayerMap, now: Date, timeZone: string): PrayerKey {
  const { minuteOfDay, isFriday } = getCurrentMinuteAndFriday(now, timeZone);

  const fajr = parsePrayerTimeToMinutes(prayers.fajr);
  const zohar = parsePrayerTimeToMinutes(prayers.zohar);
  const asr = parsePrayerTimeToMinutes(prayers.asr);
  const maghrib = parsePrayerTimeToMinutes(prayers.maghrib);
  const isha = parsePrayerTimeToMinutes(prayers.isha);
  const juma = parsePrayerTimeToMinutes(prayers.juma);

  const slots: PrayerSlot[] = [];

  if (fajr !== null) slots.push({ key: 'fajr', minuteOfDay: fajr });
  if (isFriday && juma !== null) {
    slots.push({ key: 'juma', minuteOfDay: juma });
  } else if (zohar !== null) {
    slots.push({ key: 'zohar', minuteOfDay: zohar });
  }
  if (asr !== null) slots.push({ key: 'asr', minuteOfDay: asr });
  if (maghrib !== null) slots.push({ key: 'maghrib', minuteOfDay: maghrib });
  if (isha !== null) slots.push({ key: 'isha', minuteOfDay: isha });

  if (slots.length === 0) {
    return 'isha';
  }

  slots.sort((a, b) => a.minuteOfDay - b.minuteOfDay);

  let active = slots[slots.length - 1].key;
  for (const slot of slots) {
    if (minuteOfDay >= slot.minuteOfDay) {
      active = slot.key;
      continue;
    }
    break;
  }

  return active;
}
