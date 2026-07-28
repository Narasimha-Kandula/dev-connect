'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Ban, UserCheck } from 'lucide-react';

export default function BlockedPage() {
  const [blocked, setBlocked] = useState<{ id: string; displayName: string }[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ blocked: typeof blocked }>('/blocked', token)
      .then((d) => setBlocked(d.blocked ?? []))
      .catch(() => {});
  }, [token]);

  async function handleUnblock(id: string) {
    if (!token) return;
    try {
      await api.delete(`/blocked/${id}`, token);
      setBlocked((prev) => prev.filter((b) => b.id !== id));
    } catch {}
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><Ban size={20} className="mr-2 inline" /> Blocked Users</h1>

      {blocked.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No blocked users.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {blocked.map((b) => (
          <Card key={b.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-primary">
                  {b.displayName?.charAt(0) ?? '?'}
                </div>
                <p className="font-semibold text-sm">{b.displayName}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleUnblock(b.id)}>
                <UserCheck size={14} className="mr-1" /> Unblock
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
