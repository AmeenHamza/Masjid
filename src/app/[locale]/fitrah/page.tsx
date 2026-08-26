import { getFitrahRecords, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionPage } from '@/components/section-page';
import { getTranslations } from 'next-intl/server';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Link } from '@/navigation';

function normalizeView(value: unknown) {
  return String(value || '').toLowerCase() === 'zakat' ? 'zakat' : 'fitrah';
}

export default async function FitrahPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const resolvedLocale = locale as 'en' | 'ur';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const view = normalizeView(resolvedSearchParams?.view);
  const [settings, t, common, allRecords] = await Promise.all([getSiteSettings(), getTranslations({ locale: resolvedLocale, namespace: 'pages' }), getTranslations({ locale: resolvedLocale, namespace: 'common' }), getFitrahRecords()]);

  const records = allRecords.filter((item: any) => {
    const recordType = String(item.type || 'Fitrah').toLowerCase();
    return recordType === view;
  });

  const totalMembers = records.reduce((sum: number, item: any) => sum + Number(item.membersCount || 0), 0);
  const totalAmount = records.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const rows = records.map((item: any) => ({
    family: String(item.familyName || '-'),
    members: formatNumber(Number(item.membersCount || 0)),
    amount: formatCurrency(Number(item.amount || 0)),
    year: String(item.year || '-')
  }));

  const columns = [common('family'), common('members'), common('amount'), common('year')];

  const normalizedRows = rows.map((item) => ({
    [common('family')]: item.family,
    [common('members')]: item.members,
    [common('amount')]: item.amount,
    [common('year')]: item.year
  }));

  return (
    <>
      <SiteHeader phone={settings.phone} masjidName={settings.masjidName} />
      <main className="mx-auto max-w-7xl px-4 pt-6 lg:px-6">
        <div className="grid gap-2 rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:grid-cols-2">
          <Link href="/fitrah?view=fitrah" className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'fitrah' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
            Fitrah
          </Link>
          <Link href="/fitrah?view=zakat" className={`rounded-2xl px-4 py-3 text-center text-sm font-bold transition ${view === 'zakat' ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10'}`}>
            Zakat
          </Link>
        </div>
      </main>
      <SectionPage
        brandLabel={`${common('brandTop')} ${common('brandBottom')}`}
        title={view === 'zakat' ? 'Zakat' : t('fitrah.title')}
        subtitle={view === 'zakat' ? 'Zakat records from the admin panel.' : t('fitrah.subtitle')}
        summary={[
          { label: common('families'), value: formatNumber(records.length) },
          { label: common('members'), value: formatNumber(totalMembers) },
          { label: common('amount'), value: formatCurrency(totalAmount) }
        ]}
        columns={columns}
        rows={normalizedRows}
        recordsLabel={common('records')}
        noRecordsLabel={common('noRecordsYet')}
      />
      <SiteFooter address={settings.address} phone={settings.phone} email={settings.email} />
    </>
  );
}
