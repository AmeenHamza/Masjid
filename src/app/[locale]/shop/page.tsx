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

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale = locale as 'en' | 'ur';
  const [settings, t, common, records] = await Promise.all([getSiteSettings(), getTranslations({ locale: resolvedLocale, namespace: 'pages' }), getTranslations({ locale: resolvedLocale, namespace: 'common' }), getShopRecords()]);
  const numberFormatter = new Intl.NumberFormat(resolvedLocale === 'ur' ? 'ur-PK' : 'en-PK');

  const totalShops = records.length;
  const clearShops = records.filter((item: any) => String(item.paymentStatus || '').toLowerCase() === 'clear').length;
  const totalMonthlyRent = records.reduce((sum: number, item: any) => sum + (Number(item.monthlyRent || 0) || 0), 0);

  const rows = records.map((item: any, index: number) => ({
    [common('serial')]: numberFormatter.format(index + 1),
    [common('shopName')]: String(item.shopName || item.itemName || '-'),
    [common('ownerName')]: String(item.ownerName || '-'),
    [common('monthlyRent')]: formatCurrency(Number(item.monthlyRent || 0), 'PKR', resolvedLocale),
    [common('paymentStatus')]: String(item.paymentStatus || '-').toLowerCase() === 'clear' ? common('clear') : String(item.paymentStatus || '-').toLowerCase() === 'due' ? common('due') : String(item.paymentStatus || '-').toLowerCase() === 'partial' ? common('partial') : '-'
  }));

  const columns = [common('serial'), common('shopName'), common('ownerName'), common('monthlyRent'), common('paymentStatus')];

  const normalizedRows = rows;

  return (
    <>
      <SiteHeader phone={settings.phone} masjidName={settings.masjidName} />
      <SectionPage
        brandLabel={`${common('brandTop')} ${common('brandBottom')}`}
        title={t('shop.title')}
        subtitle={t('shop.subtitle')}
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
