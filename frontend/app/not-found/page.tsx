import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="text-6xl font-extrabold text-primary/30">404</span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Page Not Found.</h1>
      <p className="mt-2 text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>

      <div className="mt-8 flex w-full max-w-sm items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Search DevConnect…"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/"><Button><ArrowLeft size={14} className="mr-1" /> Go Home</Button></Link>
        <Link href="/discover"><Button variant="secondary">Discover Developers</Button></Link>
        <Link href="/contact"><Button variant="ghost">Contact Support</Button></Link>
      </div>
    </div>
  );
}
