'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [msg, setMsg] = useState('Completing authentication…');

  useEffect(() => {
    const provider = searchParams.get('provider');
    const code = searchParams.get('code');

    if (!provider || !code) {
      setMsg('Invalid OAuth response — missing provider or code.');
      return;
    }

    api
      .post<{ accessToken: string; refreshToken: string }>('/auth/oauth/callback', {
        provider,
        code,
        redirectUri: `${window.location.origin}/auth/callback?provider=${provider}`,
      })
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken);
        useAuthStore.getState().initialize();
        router.push('/dashboard');
      })
      .catch(() => {
        setMsg('Authentication failed. Please try logging in again.');
      });
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
      {msg}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
