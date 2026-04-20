export const dynamic = 'force-dynamic';

import { getSummaryMetrics, getGallery, getProjects, getTodayPrayerTimes } from '@/lib/public-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function AdminDashboardPage() {
  const [metrics, gallery, projects, prayers] = await Promise.all([
    getSummaryMetrics(),
    getGallery(),
    getProjects(),
    getTodayPrayerTimes()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black">Dashboard</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">All public data is sourced from the admin collections.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><div className="text-sm text-slate-500">Income</div><div className="mt-2 text-3xl font-black">{metrics.totalIncome}</div></Card>
        <Card><div className="text-sm text-slate-500">Donation</div><div className="mt-2 text-3xl font-black">{metrics.totalDonation}</div></Card>
        <Card><div className="text-sm text-slate-500">Projects</div><div className="mt-2 text-3xl font-black">{projects.length}</div></Card>
        <Card><div className="text-sm text-slate-500">Gallery</div><div className="mt-2 text-3xl font-black">{gallery.length}</div></Card>
      </div>
      <Card>
        <h2 className="text-2xl font-black">Today's Prayer Times</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(prayers).map(([key, value]) => (
            <Badge key={key} className="bg-emerald-700 text-white">{key}: {String(value)}</Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
