import { redirect } from 'next/navigation';

export default async function DuplicateUrRedirectPage({
  params
}: {
  params: Promise<{ locale: string; rest: string[] }>;
}) {
  const { locale, rest } = await params;
  const safeRest = rest?.join('/') || '';
  redirect(`/${locale}/${safeRest}`);
}
