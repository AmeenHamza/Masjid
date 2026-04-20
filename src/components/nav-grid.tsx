import { Link } from '@/navigation';
import { Card } from './ui/card';

const cards = [
  { key: 'income', color: 'bg-emerald-700', href: '/admin/income-records' },
  { key: 'expense', color: 'bg-amber-500', href: '/admin/expense-records' },
  { key: 'shop', color: 'bg-cyan-600', href: '/admin/shop-records' },
  { key: 'donation', color: 'bg-rose-600', href: '/admin/donations' },
  { key: 'ramadanDonation', color: 'bg-teal-700', href: '/admin/ramadan-donations' },
  { key: 'ramadanExpense', color: 'bg-indigo-700', href: '/admin/ramadan-expenses' },
  { key: 'fitrah', color: 'bg-lime-700', href: '/admin/fitrah-records' },
  { key: 'project', color: 'bg-slate-700', href: '/admin/projects' },
  { key: 'gallery', color: 'bg-fuchsia-700', href: '/admin/gallery' }
];

export function NavGrid({ labels, counts, showMoreLabel, summaryLabel }: { labels: Record<string, string>; counts: Record<string, string>; showMoreLabel: string; summaryLabel: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.key} className={`overflow-hidden border-0 p-0 text-white ${card.color}`}>
          <div className="flex h-full flex-col justify-between p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">{labels[card.key]}</p>
              <div className="mt-4 text-3xl font-black">{counts[card.key] || '0'}</div>
              <p className="mt-1 text-sm text-white/85">{summaryLabel}</p>
            </div>
            <Link href={card.href} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-slate-950 transition hover:bg-white/90">
              {showMoreLabel}
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
