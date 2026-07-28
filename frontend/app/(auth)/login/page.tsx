'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validations';

function getOAuthUrl(provider: 'github' | 'google') {
  const githubId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const googleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);

  if (provider === 'github') {
    if (!githubId) return null;
    const redirect = `${window.location.origin}/auth/callback`;
    return `https://github.com/login/oauth/authorize?client_id=${githubId}&redirect_uri=${encodeURIComponent(redirect)}&scope=user:email&state=${state}`;
  }

  if (!googleId) return null;
  const redirect = `${window.location.origin}/auth/google/callback`;
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=email%20profile&state=${state}`;
}

export default function LoginPage() {
  const router = useRouter();
  const loginStore = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    setError(null);
    try {
      await loginStore(data.email, data.password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider: 'github' | 'google') {
    const url = getOAuthUrl(provider);
    if (!url) {
      setError(`${provider} OAuth is not configured. Set NEXT_PUBLIC_${provider === 'github' ? 'GITHUB' : 'GOOGLE'}_CLIENT_ID.`);
      return;
    }
    window.location.href = url;
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Welcome Back.</CardTitle>
          <p className="text-sm text-muted-foreground">Log in to continue building.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                type="password"
                {...register('password')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in…' : 'Log In'}
            </Button>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => handleOAuth('github')}>GitHub</Button>
              <Button type="button" variant="secondary" onClick={() => handleOAuth('google')}>Google</Button>
            </div>

            <div className="flex justify-between text-sm text-muted-foreground">
              <Link href="/forgot-password" className="hover:text-foreground">Forgot password?</Link>
              <Link href="/signup" className="hover:text-foreground">Create account</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
