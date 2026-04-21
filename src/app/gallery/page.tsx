import LocaleGalleryPage from '../[locale]/gallery/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function GalleryPage() {
  return renderLocalePage(LocaleGalleryPage);
}