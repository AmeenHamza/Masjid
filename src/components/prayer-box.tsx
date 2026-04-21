'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from './ui/badge';

const prayerKeys = ['fajr', 'zohar', 'asr', 'maghrib', 'isha', 'juma'] as const;

export function PrayerBox({ prayers }: { prayers: Record<string, string> }) {
  const common = useTranslations('common');
  const t = useTranslations('prayers');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const activePrayer = useMemo(() => {
    const hour = now.getHours() + now.getMinutes() / 60;
    if (hour >= 18.1) return 'maghrib';
    if (hour >= 15.5) return 'asr';
    if (hour >= 12.0) return 'zohar';
    if (hour >= 5.0) return 'fajr';
    return 'isha';
  }, [now]);

  return (
    <aside className="rounded-[2rem] border border-slate-900/80 bg-slate-950 p-5 text-white shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-emerald-300">{common('prayerTimes')}</p>
          <h2 className="mt-2 text-2xl font-black">{common('prayerTimes')}</h2>
        </div>
        <Badge className="bg-amber-400 text-slate-950">{t(activePrayer)}</Badge>
      </div>
      <div className="mt-5 space-y-3">
        {prayerKeys.map((key) => (
          <div key={key} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${activePrayer === key ? 'bg-emerald-700' : 'bg-white/5'}`}>
            <span className="text-lg font-bold">{t(key)}</span>
            <span className="text-lg font-semibold">{String(prayers[key] || '00:00')}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
