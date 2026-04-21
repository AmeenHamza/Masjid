export const dynamic = 'force-dynamic';

import { getSummaryMetrics, getGallery, getProjects, getTodayPrayerTimes } from '@/lib/public-data';
import { AdminDashboardContent } from '@/components/admin-dashboard-content';

export default async function AdminDashboardPage() {
  const [metrics, gallery, projects, prayers] = await Promise.all([
    getSummaryMetrics(),
    getGallery(),
    getProjects(),
    getTodayPrayerTimes()
  ]);

  return <AdminDashboardContent metrics={metrics} gallery={gallery} projects={projects} prayers={prayers} />;
}
