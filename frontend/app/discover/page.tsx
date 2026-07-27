'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { X, Heart, Star } from 'lucide-react';

interface SkillRef { skill: { name: string } }
interface DiscoverProfile {
  id: string;
  userId: string;
  displayName: string;
  headline?: string;
  bio?: string;
  availability: string;
  skills: SkillRef[];
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<DiscoverProfile[]>('/discover', token);
      setProfiles(data);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function swipe(action: 'LIKE' | 'SUPER_LIKE' | 'PASS') {
    const current = profiles[index];
    if (!current) return;
    await api.post('/discover/swipe', { targetId: current.userId, action }, token);
    setIndex((i) => i + 1);
  }

  const current = profiles[index];

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Discover Developers</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading feed…</p>
      ) : !current ? (
        <Card className="w-full text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No more profiles right now — check back soon.</p>
            <Button className="mt-4" onClick={loadFeed}>Refresh Feed</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-muted text-4xl font-bold text-primary">
              {current.displayName?.[0] ?? '?'}
            </div>
            <h2 className="text-xl font-semibold">{current.displayName}</h2>
            {current.headline && <p className="text-sm text-muted-foreground">{current.headline}</p>}
            {current.bio && <p className="mt-3 text-sm">{current.bio}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              {current.skills?.map((s) => (
                <span key={s.skill.name} className="rounded-full bg-muted px-3 py-1 text-xs">
                  {s.skill.name}
                </span>
              ))}
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <Button variant="secondary" size="lg" onClick={() => swipe('PASS')} aria-label="Pass">
                <X />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => swipe('SUPER_LIKE')} aria-label="Super like">
                <Star className="text-accent" />
              </Button>
              <Button size="lg" onClick={() => swipe('LIKE')} aria-label="Like">
                <Heart />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
