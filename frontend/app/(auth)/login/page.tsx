'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

function getOAuthUrl(provider: 'github' | 'google') {
  const base = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/auth/oauth`;
  const redirect = `${window.location.origin}/auth/callback?provider=${provider}`;

  if (provider === 'github') {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) return null;
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&scope=user:email`;
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=email%20profile`;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string }>(
        '/auth/login',
        { email, password },
      );
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
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
