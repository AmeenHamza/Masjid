import { json } from '@/lib/api';
import { getProjects } from '@/lib/public-data';

export async function GET() {
  return json({ ok: true, items: await getProjects() });
}
