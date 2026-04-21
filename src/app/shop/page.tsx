import LocaleShopPage from '../[locale]/shop/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function ShopPage() {
  return renderLocalePage(LocaleShopPage);
}