import { Landmark } from 'lucide-react';

export function Logo({ compact = false, topText = 'Jami Masjid', bottomText = 'Noori & Madrasa' }: { compact?: boolean; topText?: string; bottomText?: string }) {
  return (
    <div className="flex items-center gap-3 text-white">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
        <Landmark className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">{topText}</div>
          <div className="text-base font-bold">{bottomText}</div>
        </div>
      )}
    </div>
  );
}
