import { GroupedRecordPanel } from '@/components/grouped-record-panel';

export default function DonationsAdminPage() {
  return (
    <GroupedRecordPanel
      title="Donations"
      subtitle="Switch between Friday, Box, Masjid, and Madrasa donation records. Each tab uses its own record defaults and form fields."
      tabs={[
        {
          key: 'friday',
          label: 'Friday Donation',
          resourceKey: 'donations',
          description: 'Friday donations with donor name, amount, month, year, and note.',
          defaultValues: { type: 'Friday', amount: 0 },
          extraValues: { type: 'Friday' },
          hideFields: ['type']
        },
        {
          key: 'box',
          label: 'Box Donation',
          resourceKey: 'donations',
          description: 'Box donations with the same base details but a fixed Box type.',
          defaultValues: { type: 'Box', amount: 0 },
          extraValues: { type: 'Box' },
          hideFields: ['type']
        },
        {
          key: 'masjid',
          label: 'Masjid Donation',
          resourceKey: 'donations',
          description: 'Masjid donations with the same base details but a fixed Masjid type.',
          defaultValues: { type: 'Masjid', amount: 0 },
          extraValues: { type: 'Masjid' },
          hideFields: ['type']
        },
        {
          key: 'madrasa',
          label: 'Madrasa Donation',
          resourceKey: 'donations',
          description: 'Madrasa donations with the same base details but a fixed Madrasa type.',
          defaultValues: { type: 'Madrasa', amount: 0 },
          extraValues: { type: 'Madrasa' },
          hideFields: ['type']
        }
      ]}
    />
  );
}
