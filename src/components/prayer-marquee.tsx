type MarqueeItem = {
  key: string;
  label: string;
  time?: string;
  period?: string;
};

export function PrayerMarquee({
  text,
  locale,
  items
}: {
  text: string;
  locale: 'en' | 'ur';
  items: MarqueeItem[];
}) {
  const fallbackText = text || 'Prayer times are available from admin panel.';
  const prayerItems = items.filter((item) => Boolean(item.time));
  const directionClass = locale === 'ur' ? 'prayer-marquee-track--ur' : 'prayer-marquee-track--en';

  return (
    <div className="overflow-hidden border-y border-emerald-800/20 bg-emerald-700 text-white">
      <div className="px-4 py-2 text-sm font-semibold">
        {prayerItems.length > 0 ? (
          <div className={`prayer-marquee-track ${directionClass} inline-flex w-max items-center gap-5 whitespace-nowrap`}>
            {prayerItems.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <span className="font-bold">{item.label}</span>
                <span dir="ltr" className="inline-flex items-center gap-1 text-white/90 tabular-nums [unicode-bidi:isolate]">
                  <span>{item.time}</span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em]">{item.period}</span>
                </span>
              </span>
            ))}
          </div>
        ) : (
          <span>{fallbackText}</span>
        )}
      </div>
    </div>
  );
}
