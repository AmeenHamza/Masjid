export const dynamic = 'force-dynamic';

import { getMessages, getTranslations } from 'next-intl/server';
import { getGallery, getHeroSlides, getProjects, getSiteSettings, getSummaryMetrics, getTodayPrayerTimes } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PrayerMarquee } from '@/components/prayer-marquee';
import { HeroSlider } from '@/components/hero-slider';
import { PrayerBox } from '@/components/prayer-box';
import { NavGrid } from '@/components/nav-grid';
import { SummaryMetrics } from '@/components/summary-metrics';
import { ProjectCards } from '@/components/project-cards';
import { MasonryGallery } from '@/components/masonry-gallery';
import { Card } from '@/components/ui/card';

export default async function HomePage() {
  const [settings, slides, prayers, metrics, projects, gallery, tCommon, tNav, tHome, tMetrics] = await Promise.all([
    getSiteSettings(),
    getHeroSlides(),
    getTodayPrayerTimes(),
    getSummaryMetrics(),
    getProjects(),
    getGallery(),
    getTranslations('common'),
    getTranslations('nav'),
    getTranslations('home'),
    getTranslations('metrics')
  ]);

  const labels = {
    income: tNav('income'),
    expense: tNav('expense'),
    shop: tNav('shop'),
    donation: tNav('donation'),
    ramadanDonation: tNav('ramadanDonation'),
    ramadanExpense: tNav('ramadanExpense'),
    fitrah: tNav('fitrah'),
    project: tNav('project'),
    gallery: tNav('gallery')
  };

  const counts = {
    income: String(metrics.totalIncome),
    expense: String(metrics.yearlyExpense),
    shop: '0',
    donation: String(metrics.totalDonation),
    ramadanDonation: '0',
    ramadanExpense: '0',
    fitrah: '0',
    project: String(metrics.activeProjects),
    gallery: String(gallery.length)
  };

  return (
    <main>
      <SiteHeader phone={settings.phone} />
      <PrayerMarquee text={settings.prayerMarquee || ''} />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.7fr_0.95fr] lg:px-6">
        <HeroSlider slides={slides as never} />
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
        <NavGrid labels={labels} counts={counts} showMoreLabel={tCommon('showMore')} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <Card className="border-amber-300 bg-amber-100/90 dark:border-amber-400/30 dark:bg-amber-400/10">
          <p className="text-center text-lg font-bold text-slate-900 dark:text-white">{tCommon('showMore')} - {settings.notice || 'مسجد اور مدرسہ کی انتظامیہ سے رابطہ کریں'}</p>
        </Card>
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
