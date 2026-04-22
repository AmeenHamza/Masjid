'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from './ui/badge';
import { formatPrayerTimeParts, getActivePrayerKey } from '@/lib/prayer-activity';

const prayerKeys = ['fajr', 'zohar', 'asr', 'maghrib', 'isha', 'juma'] as const;

export function PrayerBox({ prayers, timeZone = 'Asia/Karachi' }: { prayers: Record<string, string>; timeZone?: string }) {
  const locale = useLocale();
  const common = useTranslations('common');
  const t = useTranslations('prayers');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
    let intervalId: number | undefined;

    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 60_000);
    }, msToNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (typeof intervalId === 'number') {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const activePrayer = useMemo(() => {
    return getActivePrayerKey(prayers, now, timeZone);
  }, [prayers, now, timeZone]);

  return (
    <aside className="relative overflow-hidden rounded-[2rem] border border-slate-900/80 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-soft">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.08),transparent_28%)]" />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-emerald-300">{common('prayerTimes')}</p>
          <h2 className="mt-2 text-2xl font-black">{common('prayerTimes')}</h2>
        </div>
        <Badge className="border border-white/10 bg-white/10 text-white backdrop-blur">{t(activePrayer)}</Badge>
      </div>
      <div className="relative mt-5 space-y-3">
        {prayerKeys.map((key) => (
          <div key={key} className={`flex items-center justify-between rounded-2xl px-4 py-3 transition ${activePrayer === key ? 'bg-white/14 ring-1 ring-emerald-300/30' : 'bg-white/5'}`}>
            <span className="text-base font-bold tracking-wide">{t(key)}</span>
            <span dir="ltr" className="inline-flex items-center gap-1 text-lg font-semibold tabular-nums [unicode-bidi:isolate]">
              <span>{formatPrayerTimeParts(prayers[key]).time}</span>
              <span className="text-xs font-bold uppercase tracking-[0.08em]">{formatPrayerTimeParts(prayers[key]).period}</span>
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
