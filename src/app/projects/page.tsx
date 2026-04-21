import LocaleProjectsPage from '../[locale]/projects/page';
import { renderLocalePage } from '../locale-page-wrapper';

export default async function ProjectsPage() {
  return renderLocalePage(LocaleProjectsPage);
}