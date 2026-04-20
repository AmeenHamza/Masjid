export const dynamic = 'force-dynamic';

import { getFitrahRecords, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SectionPage } from '@/components/section-page';
import { getTranslations } from 'next-intl/server';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default async function FitrahPage() {
  const [settings, t, records] = await Promise.all([getSiteSettings(), getTranslations('pages'), getFitrahRecords()]);

  const totalMembers = records.reduce((sum: number, item: any) => sum + Number(item.membersCount || 0), 0);
  const totalAmount = records.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  const rows = records.map((item: any) => ({
    Family: String(item.familyName || '-'),
    Members: formatNumber(Number(item.membersCount || 0)),
    Amount: formatCurrency(Number(item.amount || 0)),
    Year: String(item.year || '-')
  }));

  return (
    <>
      <SiteHeader phone={settings.phone} />
      <SectionPage
        title={t('fitrah.title')}
        subtitle={t('fitrah.subtitle')}
        summary={[
          { label: 'Families', value: formatNumber(records.length) },
          { label: 'Members', value: formatNumber(totalMembers) },
          { label: 'Amount', value: formatCurrency(totalAmount) }
        ]}
        columns={['Family', 'Members', 'Amount', 'Year']}
        rows={rows}
      />
      <SiteFooter address={settings.address} phone={settings.phone} />
    </>
  );
}
