'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [msg, setMsg] = useState('Completing Google authentication…');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const savedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');

    if (!code) {
      setMsg('Invalid response from Google.');
      return;
    }

    if (state && savedState && state !== savedState) {
      setMsg('OAuth state mismatch — possible CSRF attack. Please try again.');
      return;
    }

    api
      .post<{ accessToken: string; refreshToken: string }>('/auth/oauth', {
        provider: 'google',
        code,
      })
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken);
        useAuthStore.getState().initialize();
        router.push('/dashboard');
      })
      .catch(() => {
        setMsg('Google authentication failed. Please try again.');
      });
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
      {msg}
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      <GoogleCallbackInner />
    </Suspense>
  );
}
