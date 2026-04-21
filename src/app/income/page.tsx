import LocaleIncomePage from '../[locale]/income/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function IncomePage() {
  return renderLocalePage(LocaleIncomePage);
}