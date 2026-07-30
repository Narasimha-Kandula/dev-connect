'use client';

import { useRouter } from 'next/navigation';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CallButton({ roomId, label = 'Start Call' }: { roomId: string; label?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => router.push(`/call/${roomId}`)}
      className="gap-2"
    >
      <Video size={16} />
      {label}
    </Button>
  );
}
