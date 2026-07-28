'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Brain, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export default function InsightsPage() {
  const [insights, setInsights] = useState<{ compatibilityScore: number; skillOverlap: string[]; suggestedActions: string[] } | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ insights: typeof insights }>('/insights', token)
      .then((d) => setInsights(d.insights)).catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><Brain size={20} className="mr-2 inline" /> AI Insights</h1>
      <p className="text-sm text-muted-foreground">Match intelligence powered by machine learning.</p>

      {!insights && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No insights yet. Start matching to unlock AI-powered analysis.
          </CardContent>
        </Card>
      )}

      {insights && (
        <>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <span className="text-3xl font-bold text-primary">{Math.round(insights.compatibilityScore * 100)}%</span>
              </div>
              <p className="font-semibold">Overall Compatibility Score</p>
              <p className="text-sm text-muted-foreground">Across all your active matches</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 font-semibold"><TrendingUp size={16} className="mr-1 inline" /> Skill Overlap</p>
              <div className="flex flex-wrap gap-2">
                {insights.skillOverlap.map((s) => (
                  <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{s}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 font-semibold"><Users size={16} className="mr-1 inline" /> Suggested Actions</p>
              <ul className="space-y-2">
                {insights.suggestedActions.map((a, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      <Link href="/recommendations"><Button variant="secondary">View AI Recommendations</Button></Link>
    </div>
  );
}
