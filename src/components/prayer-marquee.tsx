import { useTranslations } from 'next-intl';

export function PrayerMarquee({ text }: { text: string }) {
  const t = useTranslations('home');
  const message = text || t('marquee');

  return (
    <div className="overflow-hidden border-y border-emerald-800/20 bg-emerald-700 text-white">
      <div className="marquee flex min-w-full gap-10 whitespace-nowrap px-4 py-2 text-sm font-semibold">
        <span>{message}</span>
        <span>{message}</span>
        <span>{message}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
