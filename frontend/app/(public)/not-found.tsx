import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: '404 — Page Not Found | DevConnect',
  robots: { index: false },
};

export default function PublicNotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="text-8xl font-extrabold text-primary/20">404</span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Page Not Found.
      </h1>
      <p className="mt-2 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="gradient-brand inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <Link
          href="/features"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/30"
        >
          Explore Features
        </Link>
      </div>
    </div>
  );
}
