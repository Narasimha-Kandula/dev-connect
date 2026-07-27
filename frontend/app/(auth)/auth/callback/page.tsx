'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const provider = (searchParams.get('provider') ?? 'github') as 'github' | 'google';

    if (!code) {
      setError('No authorization code received');
      return;
    }

    api
      .post<{ accessToken: string; refreshToken: string }>('/auth/oauth', { code, provider })
      .then((data) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        router.push('/dashboard');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'OAuth failed');
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold text-danger">Authentication Failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-semibold">Signing you in...</h1>
      <p className="mt-2 text-sm text-muted-foreground">Please wait while we complete authentication.</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-semibold">Signing you in...</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please wait...</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
