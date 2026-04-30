'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { backendApiUrl } from '@/lib/backend-url';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations('auth');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${backendApiUrl}/auth/me`, { credentials: 'include' });
        if (response.ok) {
          router.replace('/admin');
        }
      } catch {
        // Ignore on load; form submit will show explicit error if backend is unavailable.
      }
    };

    checkSession();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData(event.currentTarget);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${backendApiUrl}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData.entries())),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        signal: controller.signal
      });

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        setError(t('loginFailed'));
        return;
      }

      router.push('/admin');
    } catch {
      setError(t('loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_10%_10%,_rgba(13,148,136,0.22),_transparent_34%),radial-gradient(circle_at_90%_12%,_rgba(249,115,22,0.18),_transparent_28%),linear-gradient(180deg,#06211f,#0b2c28)] px-4 text-white">
      <Card className="reveal w-full max-w-md border-white/20 bg-white/12 p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
        <h1 className="text-3xl font-black tracking-tight">{t('signInTitle')}</h1>
        <p className="mt-2 text-sm text-white/75">{t('adminLoginDescription')}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <div className="mb-2 text-sm font-semibold">{t('email')}</div>
            <Input name="email" type="email" placeholder={t('enterEmail') || 'Enter your email'} className="border-white/20 bg-white/95 text-slate-900 placeholder:text-slate-400" />
          </label>
          <label className="block">
            <div className="mb-2 text-sm font-semibold">{t('password')}</div>
            <Input name="password" type="password" placeholder={t('enterPassword') || 'Enter your password'} className="border-white/20 bg-white/95 text-slate-900 placeholder:text-slate-400" />
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-amber-400 text-base font-bold text-slate-950 hover:bg-amber-300">
            {loading ? t('signingIn') : t('signIn')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
