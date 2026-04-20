import { json } from '@/lib/api';
import { getGallery } from '@/lib/public-data';

export async function GET() {
  return json({ ok: true, items: await getGallery() });
}
