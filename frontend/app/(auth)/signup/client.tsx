'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupInput } from '@/lib/validations';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const registerStore = useAuthStore((s) => s.register);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  function handleOAuth(provider: 'github' | 'google') {
    const githubId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const googleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);

    if (provider === 'github') {
      if (!githubId) { setError('GitHub OAuth is not configured.'); return; }
      const redirect = `${window.location.origin}/auth/callback`;
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubId}&redirect_uri=${encodeURIComponent(redirect)}&scope=user:email&state=${state}`;
      return;
    }

    if (!googleId) { setError('Google OAuth is not configured.'); return; }
    const redirect = `${window.location.origin}/auth/google/callback`;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=email%20profile&state=${state}`;
  }

  async function onSubmit(data: SignupInput) {
    setLoading(true);
    setError(null);
    try {
      await registerStore(data.name, data.email, data.password);
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-6">
      <Card className="w-full">
        <CardHeader>
          <h1 className="text-lg font-semibold">Create Your Account.</h1>
          <p className="text-sm text-muted-foreground">Join the developer collaboration network.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
              <input
                id="name"
                autoComplete="name"
                {...register('name')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.name && <p className="mt-1 text-xs text-danger" role="alert">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.email && <p className="mt-1 text-xs text-danger" role="alert">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">At least 8 characters.</p>
              {errors.password && <p className="mt-1 text-xs text-danger" role="alert">{errors.password.message}</p>}
            </div>

            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                {...register('agreed')}
                className="mt-1"
              />
              I agree to the{' '}
              <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{' '}
              <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </label>
            {errors.agreed && <p className="text-xs text-danger">{errors.agreed.message}</p>}

            {error && <p className="text-sm text-danger" role="alert">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => handleOAuth('github')}>GitHub</Button>
              <Button type="button" variant="secondary" onClick={() => handleOAuth('google')}>Google</Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-foreground underline">Log in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
