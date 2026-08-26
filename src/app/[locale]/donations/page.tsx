export const dynamic = 'force-dynamic';

import { getDonationRecords, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { getTranslations } from 'next-intl/server';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Link } from '@/navigation';

function normalizeView(value: unknown) {
  const nextValue = String(value || '').toLowerCase();
  if (nextValue === 'box') return 'box';
  if (nextValue === 'masjid') return 'masjid';
  if (nextValue === 'madrasa') return 'madrasa';
  return 'friday';
}

function viewHref(view: 'friday' | 'box' | 'masjid' | 'madrasa') {
  return `/donations?view=${view}`;
}

export default async function DonationsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const resolvedLocale = locale as 'en' | 'ur';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const view = normalizeView(resolvedSearchParams?.view);
  const [settings, t, common, records] = await Promise.all([getSiteSettings(), getTranslations({ locale: resolvedLocale, namespace: 'pages' }), getTranslations({ locale: resolvedLocale, namespace: 'common' }), getDonationRecords()]);

  const filteredRecords = records.filter((item: any) => String(item.type || '').toLowerCase() === view);
  const totalAmount = filteredRecords.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const rows = filteredRecords.map((item: any) => ({
    date: `${item.month || '-'}-${item.year || '-'}`,
    donor: String(item.donorName || '-'),
    amount: formatCurrency(Number(item.amount || 0)),
    note: String(item.note || '-')
  }));

  const columns = [common('date'), common('donor'), common('amount'), common('notes')];

  const normalizedRows = rows.map((item) => ({
    [common('date')]: item.date,
    [common('donor')]: item.donor,
    [common('amount')]: item.amount,
    [common('notes')]: item.note
  }));

  const viewLabels: Record<typeof view, string> = {
    friday: 'Friday Donation',
    box: 'Box Donation',
    masjid: 'Masjid Donation',
    madrasa: 'Madrasa Donation'
  };
  const title = viewLabels[view];
  const subtitle = `${viewLabels[view]} records from the admin panel.`;

  return (
    <>
      <SiteHeader phone={settings.phone} masjidName={settings.masjidName} />
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 lg:p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">{common('donations')}</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
              <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[420px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{common('entries')}</div>
                <div className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-emerald-300">{formatNumber(filteredRecords.length)}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{common('amount')}</div>
                <div className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-emerald-300">{formatCurrency(totalAmount)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <div className="grid gap-2 sm:grid-cols-4">
            <Link href={viewHref('friday')} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'friday' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              Friday Donation
            </Link>
            <Link href={viewHref('box')} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'box' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              Box Donation
            </Link>
            <Link href={viewHref('masjid')} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'masjid' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              Masjid Donation
            </Link>
            <Link href={viewHref('madrasa')} className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'madrasa' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
              Madrasa Donation
            </Link>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
          <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-5 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{common('records')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-700 dark:border-white/10 dark:text-slate-300">
                  {columns.map((column) => (
                    <th key={column} className="px-6 py-4 font-bold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalizedRows.length ? (
                  normalizedRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-slate-100 dark:border-white/5">
                      {columns.map((column) => (
                        <td key={column} className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {row[column] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {common('noRecordsYet')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <SiteFooter address={settings.address} phone={settings.phone} />
    </>
  );
}
