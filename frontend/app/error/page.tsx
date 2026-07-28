'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home } from 'lucide-react';

export default function ErrorPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="text-6xl font-extrabold text-danger/30">500</span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Something Went Wrong.</h1>
      <p className="mt-2 text-muted-foreground">
        An unexpected error occurred. Our team has been notified and is working on a fix.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()}>
          <RefreshCw size={14} className="mr-1" /> Try Again
        </Button>
        <Link href="/"><Button variant="secondary"><Home size={14} className="mr-1" /> Go Home</Button></Link>
        <Link href="/contact"><Button variant="ghost">Report Issue</Button></Link>
      </div>
    </div>
  );
}
