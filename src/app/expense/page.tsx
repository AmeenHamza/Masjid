import LocaleExpensePage from '../[locale]/expense/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function ExpensePage() {
  return renderLocalePage(LocaleExpensePage);
}