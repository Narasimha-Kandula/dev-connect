'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ArrowLeft, Ban, UserX } from 'lucide-react';
import { Avatar } from '@/lib/avatar';
import { toast } from 'sonner';

interface BlockedEntry {
  id: string;
  blockedId: string;
  createdAt: string;
  blocked: {
    id: string;
    profile: { displayName: string; avatarUrl: string | null } | null;
  };
}

export default function BlockedPage() {
  const token = useAuthStore((s) => s.token);
  const [blocked, setBlocked] = useState<BlockedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.get<BlockedEntry[]>('/users/me/blocked', token)
      .then(setBlocked)
      .catch(() => toast.error('Failed to load blocked users'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleUnblock(targetId: string) {
    if (!token) return;
    try {
      await api.delete(`/users/${targetId}/block`, token);
      setBlocked((prev) => prev.filter((b) => b.blockedId !== targetId));
      toast.success('User unblocked');
    } catch { toast.error('Failed to unblock'); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <Link href="/chat/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Chat Settings
      </Link>
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Ban size={20} /> Blocked Users
      </h1>

      <Card>
        <CardHeader><CardTitle>Blocked Users</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : blocked.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <UserX size={32} className="text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No blocked users.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blocked.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={entry.blocked.profile?.avatarUrl ?? null}
                      name={entry.blocked.profile?.displayName ?? 'Unknown'}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium">{entry.blocked.profile?.displayName ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">Blocked {new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/profile/${entry.blockedId}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                    <Button variant="secondary" size="sm" onClick={() => handleUnblock(entry.blockedId)}>
                      Unblock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
