export const dynamic = 'force-dynamic';

import { getShopRecords, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionPage } from '@/components/section-page';
import { getTranslations } from 'next-intl/server';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale = locale as 'en' | 'ur';
  const [settings, t, common, records] = await Promise.all([getSiteSettings(), getTranslations({ locale: resolvedLocale, namespace: 'pages' }), getTranslations({ locale: resolvedLocale, namespace: 'common' }), getShopRecords()]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthly = records.filter((item: any) => item.month === currentMonth && item.year === currentYear).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const yearly = records.filter((item: any) => item.year === currentYear).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const rows = records.map((item: any) => ({
    date: `${item.month || '-'}-${item.year || '-'}`,
    item: String(item.itemName || '-'),
    quantity: formatNumber(Number(item.quantity || 0)),
    amount: formatCurrency(Number(item.amount || 0))
  }));

  const columns = [common('date'), common('item'), common('quantity'), common('amount')];

  const normalizedRows = rows.map((item) => ({
    [common('date')]: item.date,
    [common('item')]: item.item,
    [common('quantity')]: item.quantity,
    [common('amount')]: item.amount
  }));

  return (
    <>
      <SiteHeader phone={settings.phone} />
      <SectionPage
        brandLabel={`${common('brandTop')} ${common('brandBottom')}`}
        title={t('shop.title')}
        subtitle={t('shop.subtitle')}
        summary={[
          { label: common('monthly'), value: formatCurrency(monthly) },
          { label: common('yearly'), value: formatCurrency(yearly) },
          { label: common('entries'), value: formatNumber(records.length) }
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
