'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    api.post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-center text-lg font-semibold">Email Verification</h1>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === 'verifying' && (
            <p className="text-muted-foreground">Verifying your email...</p>
          )}
          {status === 'success' && (
            <>
              <p className="text-green-600">{message}</p>
              <Button onClick={() => router.push('/login')}>
                Go to Login
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-red-600">{message}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="secondary" onClick={() => router.push('/login')}>
                  Back to Login
                </Button>
                <Button onClick={() => router.push('/send-verification')}>
                  Resend Verification
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
