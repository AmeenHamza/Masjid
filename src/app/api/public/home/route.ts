import { json } from '@/lib/api';
import { getGallery, getHeroSlides, getProjects, getSiteSettings, getSummaryMetrics, getTodayPrayerTimes } from '@/lib/public-data';

export async function GET() {
  const [settings, slides, prayers, metrics, projects, gallery] = await Promise.all([
    getSiteSettings(),
    getHeroSlides(),
    getTodayPrayerTimes(),
    getSummaryMetrics(),
    getProjects(),
    getGallery()
  ]);

  return json({ ok: true, settings, slides, prayers, metrics, projects, gallery });
}
