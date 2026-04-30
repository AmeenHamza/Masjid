import { json } from '@/lib/api';
import { getServerSession } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return json({ ok: false, session: null }, { status: 401 });
  }

  return json({ ok: true, session });
}
