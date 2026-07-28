'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Sparkles, User, Folder, Info } from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'developer' | 'project';
  displayName?: string;
  title?: string;
  headline?: string;
  reason: string;
}

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ recommendations: Recommendation[] }>('/recommendations', token)
      .then((d) => setRecs(d.recommendations ?? []))
      .catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><Sparkles size={20} className="mr-2 inline" /> AI Recommendations</h1>
      <p className="text-sm text-muted-foreground">Personalized suggestions based on your profile and activity.</p>

      {recs.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Complete your profile to unlock personalized recommendations.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {recs.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-start gap-4 pt-6">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${r.type === 'developer' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                {r.type === 'developer' ? <User size={18} /> : <Folder size={18} />}
              </div>
              <div className="flex-1">
                <Link href={r.type === 'developer' ? `/profile/${r.id}` : `/projects/${r.id}`}>
                  <p className="font-semibold hover:text-primary transition-colors">{r.displayName ?? r.title}</p>
                </Link>
                <p className="text-sm text-muted-foreground">{r.headline}</p>
                <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  <span>{r.reason}</span>
                </div>
              </div>
              <Link href={r.type === 'developer' ? `/profile/${r.id}` : `/projects/${r.id}`}>
                <Button variant="secondary" size="sm">View</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
