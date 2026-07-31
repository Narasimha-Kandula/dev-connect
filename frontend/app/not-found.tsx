import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found — DevConnect',
  description: 'The page you are looking for does not exist. Find developers, projects, and collaborators on DevConnect.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="text-7xl font-black text-primary/20">404</span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Page Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/developers"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
        >
          Find Developers
        </Link>
        <Link
          href="/features"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
        >
          Explore Features
        </Link>
      </div>
      <div className="mt-12 flex flex-wrap gap-6 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
        <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
        <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
      </div>
    </div>
  );
}
