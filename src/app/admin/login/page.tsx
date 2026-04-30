import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { AdminLoginForm } from '@/components/admin-login-form';

export default async function AdminLoginPage() {
  const session = await getServerSession();
  if (session) {
    redirect('/admin');
  }

  return <AdminLoginForm />;
}
