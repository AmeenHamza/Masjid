import LocaleShopPage from '../[locale]/shop/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function ShopPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  return renderLocalePage(LocaleShopPage, searchParams);
}