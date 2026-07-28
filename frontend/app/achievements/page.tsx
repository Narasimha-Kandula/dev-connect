'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Award, Lock, Star, Zap, Users, MessageCircle } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ achievements: Achievement[] }>('/achievements', token)
      .then((d) => setAchievements(d.achievements ?? []))
      .catch(() => {});
  }, [token]);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><Award size={20} className="mr-2 inline" /> Achievements</h1>
          <p className="text-sm text-muted-foreground">{unlocked.length} / {achievements.length} unlocked</p>
        </div>
      </div>

      {achievements.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No achievements available yet.
          </CardContent>
        </Card>
      )}

      {unlocked.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">Unlocked</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unlocked.map((a) => (
              <Card key={a.id} className="border-success/30">
                <CardContent className="pt-6 text-center">
                  <Star size={28} className="mx-auto mb-2 text-success" />
                  <p className="font-semibold text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {locked.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">Locked</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((a) => (
              <Card key={a.id} className="opacity-60">
                <CardContent className="pt-6 text-center">
                  <Lock size={28} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold text-sm">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                  {a.progress !== undefined && (
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${a.progress}%` }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
