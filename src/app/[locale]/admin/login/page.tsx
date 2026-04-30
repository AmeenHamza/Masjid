'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { backendApiUrl } from '@/lib/backend-url';

export default function AdminLoginPage() {
  const t = useTranslations('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${backendApiUrl}/auth/me`, { credentials: 'include' });
        if (response.ok) {
          window.location.replace('/admin');
        }
      } catch {
        // Ignore on load; submit handler shows error state.
      }
    };

    checkSession();
  }, []);

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
        setError('Login failed');
        return;
      }

      window.location.assign('/admin');
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,#0f172a,#111827)] px-4 text-white">
      <Card className="w-full max-w-md border-white/10 bg-white/10 text-white">
        <h1 className="text-3xl font-black">{t('signInTitle')}</h1>
        <p className="mt-2 text-sm text-white/70">{t('signInSubtitle')}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <div className="mb-2 text-sm font-semibold">{t('email')}</div>
            <Input name="email" type="email" placeholder={t('enterEmail') || 'Enter your email'} />
          </label>
          <label className="block">
            <div className="mb-2 text-sm font-semibold">{t('password')}</div>
            <Input name="password" type="password" placeholder={t('enterPassword') || 'Enter your password'} />
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full bg-amber-400 text-slate-950 hover:bg-amber-300">
            {loading ? t('signingIn') : t('signInTitle')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
