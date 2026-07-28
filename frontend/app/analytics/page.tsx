'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { BarChart, TrendingUp, Users, MessageCircle, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<{ users: number; matches: number; messages: number; activeToday: number } | null>(null);
  const [period, setPeriod] = useState('7d');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ analytics: typeof analytics }>(`/admin/analytics?period=${period}`, token)
      .then((d) => setAnalytics(d.analytics)).catch(() => {});
  }, [token, period]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><BarChart size={20} className="mr-2 inline" /> Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform usage metrics & engagement stats.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {['24h', '7d', '30d', '90d'].map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users size={24} className="mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{analytics?.users ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp size={24} className="mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{analytics?.matches ?? 0}</p>
            <p className="text-sm text-muted-foreground">Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageCircle size={24} className="mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{analytics?.messages ?? 0}</p>
            <p className="text-sm text-muted-foreground">Messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity size={24} className="mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold">{analytics?.activeToday ?? 0}</p>
            <p className="text-sm text-muted-foreground">Active Today</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
