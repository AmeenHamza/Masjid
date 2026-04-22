import { Link } from '@/navigation';
import { Card } from './ui/card';

const cards = [
  { key: 'income', color: 'bg-emerald-700', href: '/income' },
  { key: 'expense', color: 'bg-emerald-700', href: '/expense' },
  { key: 'shop', color: 'bg-emerald-700', href: '/shop' },
  { key: 'donation', color: 'bg-emerald-700', href: '/donations' },
  { key: 'fitrah', color: 'bg-emerald-700', href: '/fitrah' },
  { key: 'project', color: 'bg-emerald-700', href: '/projects' },
  { key: 'gallery', color: 'bg-emerald-700', href: '/gallery' }
];

export function NavGrid({ labels, counts, showMoreLabel }: { labels: Record<string, string>; counts: Record<string, string>; showMoreLabel: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.key} className={`group relative overflow-hidden border-0 p-0 text-white shadow-lg ${card.color}`}>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_42%)] opacity-80 transition duration-300 group-hover:opacity-100" />
          <div className="relative flex h-full flex-col justify-between p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">{labels[card.key]}</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="text-3xl font-black tabular-nums">{counts[card.key] || '0'}</div>
              </div>
            </div>
            <Link href={card.href} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-white/95 px-5 text-sm font-bold text-slate-950 transition group-hover:bg-white">
              {showMoreLabel}
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
