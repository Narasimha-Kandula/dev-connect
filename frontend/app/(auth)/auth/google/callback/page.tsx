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
    if (!code) {
      setMsg('Invalid response from Google.');
      return;
    }

    api
      .post<{ accessToken: string; refreshToken: string }>('/auth/oauth/callback', {
        provider: 'google',
        code,
        redirectUri: `${window.location.origin}/auth/google/callback`,
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
