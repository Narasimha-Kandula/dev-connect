'use client';

import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  onRefresh: () => void;
}

export function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="text-lg font-semibold">You&apos;ve seen everyone.</p>
      <p className="mt-1 text-sm text-muted-foreground">Adjust filters or check back later.</p>
      <Button className="mt-6" onClick={onRefresh}>
        <RefreshCw size={16} className="mr-2" /> Refresh
      </Button>
    </div>
  );
}
