import { requireAdmin } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';
import type { ReactNode } from 'react';

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
