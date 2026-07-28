'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { MessageCircle, UserPlus, Zap } from 'lucide-react';

interface MatchData {
  id: string;
  matchScore?: number;
  userOne: { id: string; profile?: { displayName: string; headline?: string } };
  userTwo: { id: string; profile?: { displayName: string; headline?: string } };
  conversation?: { id: string };
}

export default function MatchesPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchData[]>([]);

  useEffect(() => {
    if (!token) return;
    api.get<MatchData[]>('/matches', token)
      .then(setMatches)
      .catch(() => {});
  }, [token]);

  function partner(m: MatchData) {
    if (!user) return null;
    return m.userOne.id === user.id ? m.userTwo : m.userOne;
  }

  const openChat = useCallback(async (m: MatchData) => {
    if (!token || !user) return;
    const p = partner(m);
    if (!p) return;

    if (m.conversation?.id) {
      router.push(`/chat?conv=${m.conversation.id}`);
      return;
    }

    try {
      const conv = await api.post<{ id: string }>('/chat/conversations', { targetUserId: p.id }, token);
      router.push(`/chat?conv=${conv.id}`);
    } catch {
      router.push('/chat');
    }
  }, [token, user, router]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Matches</h1>
          <p className="text-sm text-muted-foreground">Mutual connections ready to collaborate.</p>
        </div>
        <Link href="/discover"><Button variant="secondary" size="sm"><Zap size={14} className="mr-1" /> Find More</Button></Link>
      </div>

      {matches.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No mutual matches yet. Keep swiping to find developers who share your interests.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {matches.map((m) => {
          const p = partner(m);
          if (!p) return null;
          return (
            <Card key={m.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-bold text-primary">
                    {p.profile?.displayName?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{p.profile?.displayName ?? 'User'}</p>
                      {m.matchScore !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          <Zap size={10} /> {Math.round(m.matchScore * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.profile?.headline ?? 'Developer'}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => openChat(m)}>
                    <MessageCircle size={14} className="mr-1" /> Chat
                  </Button>
                  <Link href={`/projects/create?partner=${p.id}`}>
                    <Button variant="secondary" size="sm"><UserPlus size={14} className="mr-1" /> Invite to Project</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
