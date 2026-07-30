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
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const savedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');

    if (!code) {
      router.push('/login?error=invalid_oauth_response');
      return;
    }

    const provider = searchParams.get('provider') || 'github';

    if (state && savedState && state !== savedState) {
      router.push('/login?error=csrf_mismatch');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;
    api
      .post<{ accessToken: string; refreshToken: string }>('/auth/oauth', {
        provider,
        code,
        redirectUri,
      })
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken);
        useAuthStore.getState().initialize();
        router.push('/dashboard');
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? encodeURIComponent(err.message) : 'OAuth+authentication+failed';
        router.push(`/login?error=oauth_failed&detail=${msg}`);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
