export const dynamic = 'force-dynamic';

import { getTranslations } from 'next-intl/server';
import { getGallery, getProjects, getSiteSettings, getSummaryMetrics, getTodayPrayerTimes } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PrayerMarquee } from '@/components/prayer-marquee';
import { HeroSlider } from '@/components/hero-slider';
import { PrayerBox } from '@/components/prayer-box';
import { NavGrid } from '@/components/nav-grid';
import { SummaryMetrics } from '@/components/summary-metrics';
import { ProjectCards } from '@/components/project-cards';
import { MasonryGallery } from '@/components/masonry-gallery';
import { AutoRefresh } from '@/components/auto-refresh';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale: 'en' | 'ur' = locale === 'ur' ? 'ur' : 'en';

  const [settings, prayers, metrics, projects, gallery, tCommon, tNav, tHome, tMetrics] = await Promise.all([
    getSiteSettings(),
    getTodayPrayerTimes(),
    getSummaryMetrics(),
    getProjects(),
    getGallery(),
    getTranslations({ locale: resolvedLocale, namespace: 'common' }),
    getTranslations({ locale: resolvedLocale, namespace: 'nav' }),
    getTranslations({ locale: resolvedLocale, namespace: 'home' }),
    getTranslations({ locale: resolvedLocale, namespace: 'metrics' })
  ]);

  const prayerLabels = resolvedLocale === 'ur'
    ? {
      fajr: 'فجر',
      zohar: 'ظہر',
      asr: 'عصر',
      maghrib: 'مغرب',
      isha: 'عشاء',
      juma: 'جمعہ'
    }
    : {
      fajr: 'Fajr',
      zohar: 'Zohar',
      asr: 'Asr',
      maghrib: 'Maghrib',
      isha: 'Isha',
      juma: 'Juma'
    };

  const prayerValues = prayers as Record<string, unknown>;
  const getPrayerTime = (key: string) => String(prayerValues[key] ?? '00:00') || '00:00';

  const prayerItems = [
    { key: 'fajr', label: prayerLabels.fajr, time: getPrayerTime('fajr') },
    { key: 'zohar', label: prayerLabels.zohar, time: getPrayerTime('zohar') },
    { key: 'asr', label: prayerLabels.asr, time: getPrayerTime('asr') },
    { key: 'maghrib', label: prayerLabels.maghrib, time: getPrayerTime('maghrib') },
    { key: 'isha', label: prayerLabels.isha, time: getPrayerTime('isha') },
    { key: 'juma', label: prayerLabels.juma, time: getPrayerTime('juma') }
  ];

  const labels = {
    income: tNav('income'),
    expense: tNav('expense'),
    shop: tNav('shop'),
    donation: tNav('donation'),
    fitrah: tNav('fitrah'),
    project: tNav('project'),
    gallery: tNav('gallery')
  };

  const counts = {
    income: String(metrics.totalIncome),
    expense: String(metrics.yearlyExpense),
    shop: '0',
    donation: String(metrics.totalDonation),
    fitrah: '0',
    project: String(metrics.activeProjects),
    gallery: String(gallery.length)
  };

  const galleryHeroSlides = (gallery as Array<{ mediaType?: string; url?: string; title?: string; caption?: string; order?: number }>)
    .filter((item) => item.mediaType === 'image' && Boolean(item.url))
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((item) => ({
      title: item.title || tHome('recentMedia'),
      subtitle: item.caption || settings.madrasaName,
      imageUrl: String(item.url),
      linkUrl: '/gallery'
    }));

  return (
    <main>
      <AutoRefresh />
      <SiteHeader phone={settings.phone} />
     
      <PrayerMarquee text={settings.prayerMarquee || tHome('marquee')} locale={resolvedLocale} items={prayerItems} />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.7fr_0.95fr] lg:px-6">
        <HeroSlider slides={galleryHeroSlides as never} />
        <PrayerBox prayers={prayers as Record<string, string>} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <SummaryMetrics
          metrics={metrics}
          labels={{
            totalIncome: tMetrics('totalIncome'),
            totalDonation: tMetrics('totalDonation'),
            activeProjects: tMetrics('activeProjects'),
            yearlyExpense: tMetrics('yearlyExpense')
          }}
        />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">{tHome('navigation')}</p>
            <h2 className="mt-2 text-3xl font-black">{settings.masjidName}</h2>
          </div>
        </div>
        <NavGrid labels={labels} counts={counts} showMoreLabel={tCommon('showMore')} summaryLabel={tCommon('liveSummary')} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">{tHome('projectsHeading')}</p>
            <h2 className="mt-2 text-3xl font-black">{tHome('activeProjectsHeading')}</h2>
          </div>
        </div>
        <ProjectCards projects={projects as never} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">{tHome('galleryHeading')}</p>
            <h2 className="mt-2 text-3xl font-black">{tHome('recentMedia')}</h2>
          </div>
        </div>
        <MasonryGallery items={gallery as never} />
      </section>

      <SiteFooter address={settings.address} phone={settings.phone} />
    </main>
  );
}
