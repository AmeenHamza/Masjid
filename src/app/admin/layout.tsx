import type { ReactNode } from 'react';
import { AdminProviders } from '@/components/admin-providers';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminProviders>{children}</AdminProviders>;
}
