'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
          <p className="text-6xl font-extrabold text-danger">500</p>
          <h1 className="mt-4 text-2xl font-bold">Something Went Wrong.</h1>
          <p className="mt-2 text-muted-foreground">
            We hit an unexpected error. Please try again.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => reset()}>Retry</Button>
            <Button variant="secondary" onClick={() => (window.location.href = '/')}>
              Go Home
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
