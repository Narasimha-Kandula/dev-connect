'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Activity, BarChart, Wifi } from 'lucide-react';

export default function UsagePage() {
  const [usage, setUsage] = useState<{ apiCalls: number; matchesUsed: number; storageUsed: string } | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ usage: typeof usage }>('/usage', token)
      .then((d) => setUsage(d.usage)).catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><Activity size={20} className="mr-2 inline" /> Usage</h1>
      <p className="text-sm text-muted-foreground">Your plan limits and feature usage.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Wifi size={24} className="mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{usage?.apiCalls?.toLocaleString() ?? 0}</p>
            <p className="text-sm text-muted-foreground">API Calls / 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BarChart size={24} className="mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{usage?.matchesUsed ?? 0}</p>
            <p className="text-sm text-muted-foreground">Matches Used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity size={24} className="mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{usage?.storageUsed ?? '0 MB'}</p>
            <p className="text-sm text-muted-foreground">Storage Used</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="font-semibold">Plan: Free</p>
          <div className="space-y-2 text-sm">
            {[
              { label: 'API Calls', used: usage?.apiCalls ?? 0, limit: 10000 },
              { label: 'Matches', used: usage?.matchesUsed ?? 0, limit: 50 },
              { label: 'Storage', used: usage?.storageUsed ?? '0 MB', limit: '500 MB' },
              { label: 'Team Members', used: 0, limit: 3 },
            ].map((q) => (
              <div key={q.label}>
                <div className="flex justify-between">
                  <span>{q.label}</span>
                  <span className="text-muted-foreground">{q.used} / {q.limit}</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, (typeof q.used === 'number' ? q.used : 0) / (typeof q.limit === 'number' ? q.limit : 1) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
