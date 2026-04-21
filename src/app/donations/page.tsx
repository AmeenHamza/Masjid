import LocaleDonationsPage from '../[locale]/donations/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function DonationsPage() {
  return renderLocalePage(LocaleDonationsPage);
}