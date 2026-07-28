'use client';

import { usePathname } from 'next/navigation';
import BackButton from '@/components/back-button';
import Breadcrumbs from '@/components/breadcrumbs';

const HIDE_ON: string[] = [
  '/',
  '/login',
  '/signup',
  '/onboarding',
  '/forgot-password',
  '/reset-password',
  '/auth',
];

export default function SubHeader() {
  const pathname = usePathname();

  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null;
  }

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2">
        <BackButton />
        <div className="h-4 w-px bg-border" />
        <Breadcrumbs />
      </div>
    </div>
  );
}
