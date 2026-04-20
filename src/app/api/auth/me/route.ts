import { json } from '@/lib/api';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession();
  return json({ ok: true, session });
}
