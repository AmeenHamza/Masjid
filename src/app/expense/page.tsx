import LocaleExpensePage from '../[locale]/expense/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function ExpensePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  return renderLocalePage(LocaleExpensePage, searchParams);
}