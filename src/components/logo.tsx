import { Landmark } from 'lucide-react';

export function Logo({ compact = false, topText = 'Jamia Masjid', bottomText = 'Noorani & Madrasa', tone = 'dark' }: { compact?: boolean; topText?: string; bottomText?: string; tone?: 'dark' | 'light' }) {
  const textTone = tone === 'light' ? 'text-white' : 'text-slate-900 dark:text-white';
  const mutedTone = tone === 'light' ? 'text-white/70' : 'text-slate-600 dark:text-slate-300';

  return (
    <div className={`flex items-center gap-3 ${textTone}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone === 'light' ? 'bg-white/15 ring-1 ring-white/20' : 'bg-emerald-700/10 ring-1 ring-emerald-700/15 dark:bg-white/5 dark:ring-white/10'} backdrop-blur`}>
        <Landmark className={`h-5 w-5 ${tone === 'light' ? 'text-white' : 'text-emerald-800 dark:text-emerald-300'}`} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className={`text-sm font-semibold uppercase tracking-[0.22em] ${mutedTone}`}>{topText}</div>
          <div className="text-base font-bold">{bottomText}</div>
        </div>
      )}
    </div>
  );
}
