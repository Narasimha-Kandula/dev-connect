'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

interface MatchUser { profile?: { displayName: string; headline?: string } }
interface MatchRow {
  id: string;
  userOne: MatchUser;
  userTwo: MatchUser;
  conversation?: { id: string };
  createdAt: string;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') ?? undefined;
    api.get<MatchRow[]>('/matches', token).then(setMatches).catch(() => setMatches([]));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Your Matches</h1>

      {matches.length === 0 ? (
        <p className="text-muted-foreground">
          No matches yet. Head to <Link href="/discover" className="underline">Discover</Link> to find collaborators.
        </p>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold">{m.userTwo.profile?.displayName ?? m.userOne.profile?.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.userTwo.profile?.headline ?? m.userOne.profile?.headline}
                  </p>
                </div>
                {m.conversation && (
                  <Link href={`/chat?c=${m.conversation.id}`} className="text-sm font-semibold text-primary hover:underline">
                    Start chat →
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
