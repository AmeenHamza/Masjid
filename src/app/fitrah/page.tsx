import LocaleFitrahPage from '../[locale]/fitrah/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function FitrahPage() {
  return renderLocalePage(LocaleFitrahPage);
}