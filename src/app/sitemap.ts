import type { MetadataRoute } from 'next';
import { defaultLocale } from '@/i18n/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return [
    { url: `${baseUrl}/${defaultLocale}`, lastModified: new Date() },
    { url: `${baseUrl}/${defaultLocale}/gallery`, lastModified: new Date() },
    { url: `${baseUrl}/${defaultLocale}/projects`, lastModified: new Date() }
  ];
}
