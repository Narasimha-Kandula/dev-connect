'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  displayName: string;
  score: number;
  rank: number;
  category: string;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [category, setCategory] = useState('reputation');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ entries: LeaderboardEntry[] }>(`/leaderboard?category=${category}`, token)
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => {});
  }, [token, category]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><Trophy size={20} className="mr-2 inline" /> Leaderboard</h1>

      <div className="flex gap-2">
        {['reputation', 'contributions', 'skills'].map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${category === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {entries.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No rankings available yet.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {entries.map((e, i) => (
          <Link key={e.id} href={`/profile/${e.id}`}>
            <Card className={`transition-shadow hover:shadow-md ${i < 3 ? 'border-primary/30' : ''}`}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-10 w-10 items-center justify-center">
                  {i < 3 ? <span className="text-xl">{medals[i]}</span> : <span className="text-sm font-bold text-muted-foreground">{e.rank}</span>}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-primary">
                  {e.displayName?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{e.displayName}</p>
                  <p className="text-xs text-muted-foreground">{e.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{e.score}</p>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
