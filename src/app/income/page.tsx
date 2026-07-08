import LocaleIncomePage from '../[locale]/income/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function IncomePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  return renderLocalePage(LocaleIncomePage, searchParams);
}