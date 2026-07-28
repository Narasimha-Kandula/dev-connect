'use client';

import { type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { initialized, loading } = useAuth();

  if (!initialized && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
