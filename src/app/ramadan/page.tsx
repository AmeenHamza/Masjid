import LocaleRamadanPage from '../[locale]/ramadan/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function RamadanPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  return renderLocalePage(LocaleRamadanPage, searchParams);
}
