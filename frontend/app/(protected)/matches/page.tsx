'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { MessageCircle, UserPlus, Zap, Trash2, Archive, ExternalLink, Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get<MatchData[]>('/matches', token)
      .then((d) => setMatches(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const partner = useCallback((m: MatchData) => {
    if (!user) return null;
    return m.userOne.id === user.id ? m.userTwo : m.userOne;
  }, [user]);

  async function handleUnmatch(matchId: string) {
    if (!token) return;
    setActionLoading(matchId);
    try {
      await api.post(`/matches/${matchId}/unmatch`, {}, token);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch {}
    setActionLoading(null);
  }

  async function handleArchive(matchId: string) {
    if (!token) return;
    setActionLoading(matchId);
    try {
      await api.post(`/matches/${matchId}/archive`, {}, token);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch {}
    setActionLoading(null);
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
  }, [token, user, router, partner]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

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
                <Link href={`/profile/${p.id}`} className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-primary">
                    {p.profile?.displayName?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{p.profile?.displayName ?? 'User'}</p>
                      {m.matchScore !== undefined && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          <Zap size={10} /> {Math.round(m.matchScore * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{p.profile?.headline ?? 'Developer'}</p>
                  </div>
                </Link>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => openChat(m)}>
                    <MessageCircle size={14} className="mr-1" /> Chat
                  </Button>
                  <Link href={`/projects/create?partner=${p.id}`}>
                    <Button variant="secondary" size="sm"><UserPlus size={14} className="mr-1" /> Project</Button>
                  </Link>
                  <Link href={`/profile/${p.id}`}>
                    <Button variant="ghost" size="sm"><ExternalLink size={14} /></Button>
                  </Link>
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleArchive(m.id)} disabled={actionLoading === m.id} title="Archive">
                      <Archive size={14} className="text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleUnmatch(m.id)} disabled={actionLoading === m.id} title="Unmatch">
                      <Trash2 size={14} className="text-danger" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
