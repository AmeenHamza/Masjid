export const dynamic = 'force-dynamic';

import { getGallery, getSiteSettings } from '@/lib/public-data';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { MasonryGallery } from '@/components/masonry-gallery';

export default async function GalleryPage() {
  const [settings, gallery] = await Promise.all([getSiteSettings(), getGallery()]);

  return (
    <main>
      <SiteHeader phone={settings.phone} />
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <h1 className="text-4xl font-black">Gallery</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Responsive masonry grid with images and video uploads from Supabase Storage.</p>
        <div className="mt-8">
          <MasonryGallery items={gallery as never} />
        </div>
      </section>
      <SiteFooter address={settings.address} phone={settings.phone} />
    </main>
  );
}
