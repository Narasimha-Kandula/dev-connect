'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setTokens = useAuthStore((s) => s.setTokens);
  const postedRef = useRef(false);
  const [msg, setMsg] = useState('Completing Google authentication…');

  useEffect(() => {
    if (postedRef.current) return;
    postedRef.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const savedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');

    if (!code) {
      router.push('/login?error=invalid_oauth_response');
      return;
    }

    if (state && savedState && state !== savedState) {
      router.push('/login?error=csrf_mismatch');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    api
      .post<{ accessToken: string; refreshToken: string }>('/auth/oauth', {
        provider: 'google',
        code,
        redirectUri,
      })
      .then((data) => {
        setTokens(data.accessToken, data.refreshToken);
        useAuthStore.getState().initialize();
        router.push('/dashboard');
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? encodeURIComponent(err.message) : 'Google+authentication+failed';
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

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>}>
      <GoogleCallbackInner />
    </Suspense>
  );
}
