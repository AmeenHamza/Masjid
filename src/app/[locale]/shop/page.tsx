export const dynamic = 'force-dynamic';

import { getShopRecords, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionPage } from '@/components/section-page';
import { getTranslations } from 'next-intl/server';
import { formatCurrency } from '@/lib/utils';

function formatDate(value: unknown, locale: 'en' | 'ur') {
  if (!value) {
    return '-';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function normalizeMonth(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : fallback;
}

function normalizeYear(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1900 ? parsed : fallback;
}

function normalizeShopName(value: unknown, fallback: string | null) {
  if (Array.isArray(value)) {
    return String(value[0] ?? '') || fallback;
  }

  const normalized = String(value ?? '').trim();
  return normalized ? normalized : fallback;
}

function getShopRecordMonth(record: Record<string, unknown>) {
  const directMonth = Number(record.month);
  if (Number.isInteger(directMonth) && directMonth >= 1 && directMonth <= 12) {
    return directMonth;
  }

  const sourceDate = record.date || record.buyDate;
  const parsed = new Date(String(sourceDate || ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getMonth() + 1;
}

function getShopRecordYear(record: Record<string, unknown>) {
  const directYear = Number(record.year);
  if (Number.isInteger(directYear) && directYear >= 1900) {
    return directYear;
  }

  const sourceDate = record.date || record.buyDate;
  const parsed = new Date(String(sourceDate || ''));
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

export default async function ShopPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale } = await params;
  const resolvedLocale = locale as 'en' | 'ur';
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const allRecords = await getShopRecords();
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const selectedShopName = normalizeShopName(resolvedSearchParams?.shopName, null);
  const selectedMonth = normalizeMonth(resolvedSearchParams?.month, currentMonth);
  const selectedYear = normalizeYear(resolvedSearchParams?.year, currentYear);
  const [settings, t, common] = await Promise.all([getSiteSettings(), getTranslations({ locale: resolvedLocale, namespace: 'pages' }), getTranslations({ locale: resolvedLocale, namespace: 'common' })]);
  const numberFormatter = new Intl.NumberFormat(resolvedLocale === 'ur' ? 'ur-PK' : 'en-PK');

  const shopNames = Array.from(new Set(allRecords.map((item: any) => String(item.shopName || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const years = Array.from(new Set(allRecords
    .filter((item: any) => !selectedShopName || String(item.shopName || '').trim() === selectedShopName)
    .map((item: any) => getShopRecordYear(item) || new Date().getFullYear()))).filter((year) => Number.isInteger(year)).sort((a, b) => b - a);
  const records = allRecords.filter((item: any) =>
    (!selectedShopName || String(item.shopName || '').trim() === selectedShopName) &&
    getShopRecordMonth(item) === selectedMonth &&
    getShopRecordYear(item) === selectedYear
  );

  const totalShops = records.length;
  const clearShops = records.filter((item: any) => String(item.paymentStatus || '').toLowerCase() === 'clear').length;
  const totalMonthlyRent = records.reduce((sum: number, item: any) => sum + (Number(item.monthlyRent || 0) || 0), 0);

  const rows = records.map((item: any, index: number) => ({
    [common('serial')]: numberFormatter.format(index + 1),
    [common('date')]: formatDate(item.date || item.buyDate, resolvedLocale),
    [common('month')]: String(getShopRecordMonth(item) || selectedMonth),
    [common('year')]: String(getShopRecordYear(item) || selectedYear),
    [common('shopName')]: String(item.shopName || item.itemName || '-'),
    [common('ownerName')]: String(item.ownerName || '-'),
    [common('monthlyRent')]: formatCurrency(Number(item.monthlyRent || 0), 'PKR', resolvedLocale),
    [common('paymentStatus')]: String(item.paymentStatus || '-').toLowerCase() === 'clear' ? common('clear') : String(item.paymentStatus || '-').toLowerCase() === 'due' ? common('due') : String(item.paymentStatus || '-').toLowerCase() === 'partial' ? common('partial') : '-'
  }));

  const columns = [common('serial'), common('date'), common('month'), common('year'), common('shopName'), common('ownerName'), common('monthlyRent'), common('paymentStatus')];

  const normalizedRows = rows;

  return (
    <>
      <SiteHeader phone={settings.phone} masjidName={settings.masjidName} />
      <main className="mx-auto max-w-7xl px-4 pt-6 lg:px-6">
        <form className="mb-6 grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="min-w-0">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{common('shop')}</div>
            <select name="shopName" defaultValue={selectedShopName ?? ''} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <option value="">{t('allShops')}</option>
              {shopNames.map((shopName) => (
                <option key={shopName} value={shopName}>{shopName}</option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{common('month')}</div>
            <select name="month" defaultValue={String(selectedMonth)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </label>
          <label className="min-w-0">
            <div className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{common('year')}</div>
            <select name="year" defaultValue={String(selectedYear)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-white">
              {years.length ? years.map((year) => (
                <option key={year} value={year}>{year}</option>
              )) : <option value={selectedYear}>{selectedYear}</option>}
            </select>
          </label>
          <button type="submit" className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600">Filter</button>
        </form>
      </main>
      <SectionPage
        brandLabel={`${common('brandTop')} ${common('brandBottom')}`}
        title={t('shop.title')}
        subtitle={`${t('shop.subtitle')} ${selectedMonth}/${selectedYear}`}
        summary={[
          { label: common('entries'), value: numberFormatter.format(totalShops) },
          { label: common('clearShops'), value: numberFormatter.format(clearShops) },
          { label: common('monthlyRentTotal'), value: formatCurrency(totalMonthlyRent, 'PKR', resolvedLocale) }
        ]}
        columns={columns}
        rows={normalizedRows}
        recordsLabel={common('records')}
        noRecordsLabel={common('noRecordsYet')}
      />
      <SiteFooter address={settings.address} phone={settings.phone} />
    </>
  );
}
