import { json } from '@/lib/api';
import { getTodayPrayerTimes } from '@/lib/public-data';

export async function GET() {
  return json({ ok: true, prayerTimes: await getTodayPrayerTimes() });
}
