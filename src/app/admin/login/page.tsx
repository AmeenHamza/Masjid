'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { backendApiUrl } from '@/lib/backend-url';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const response = await fetch(`${backendApiUrl}/auth/me`, { credentials: 'include' });
      if (response.ok) {
        router.replace('/admin');
      }
    };

    checkSession();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`${backendApiUrl}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData.entries())),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    setLoading(false);

    if (!response.ok) {
      setError('Login failed. Please check email/password.');
      return;
    }

    router.push('/admin');
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_10%_10%,_rgba(13,148,136,0.22),_transparent_34%),radial-gradient(circle_at_90%_12%,_rgba(249,115,22,0.18),_transparent_28%),linear-gradient(180deg,#06211f,#0b2c28)] px-4 text-white">
      <Card className="reveal w-full max-w-md border-white/20 bg-white/12 p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
        <h1 className="text-3xl font-black tracking-tight">Admin Sign In</h1>
        <p className="mt-2 text-sm text-white/75">Login to manage masjid data and website content.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <div className="mb-2 text-sm font-semibold">Email</div>
            <Input name="email" type="email" defaultValue="admin@masjid.com" className="border-white/20 bg-white/95 text-slate-900 placeholder:text-slate-400" />
          </label>
          <label className="block">
            <div className="mb-2 text-sm font-semibold">Password</div>
            <Input name="password" type="password" defaultValue="admin123" className="border-white/20 bg-white/95 text-slate-900 placeholder:text-slate-400" />
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-amber-400 text-base font-bold text-slate-950 hover:bg-amber-300">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
