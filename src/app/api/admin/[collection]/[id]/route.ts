import { connectToDatabase } from '@/lib/db';
import { apiError, json } from '@/lib/api';
import { getServerSession } from '@/lib/auth';
import { resourceMap } from '@/lib/admin-resources';

type Params = { params: Promise<{ collection: string; id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { collection, id } = await params;
  const resource = resourceMap[collection as keyof typeof resourceMap];
  if (!resource) return apiError('Unknown collection', 404);

  const session = await getServerSession();
  if (!session) return apiError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = resource.schema.partial().safeParse(body);
  if (!parsed.success) return apiError('Validation failed', 400, parsed.error.flatten());

  await connectToDatabase();
  const updated = await resource.model.findByIdAndUpdate(id, { ...parsed.data, addedBy: session.id }, { new: true });
  return json({ ok: true, item: updated });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { collection, id } = await params;
  const resource = resourceMap[collection as keyof typeof resourceMap];
  if (!resource) return apiError('Unknown collection', 404);

  const session = await getServerSession();
  if (!session) return apiError('Unauthorized', 401);

  await connectToDatabase();
  await resource.model.findByIdAndDelete(id);
  return json({ ok: true });
}
