import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
