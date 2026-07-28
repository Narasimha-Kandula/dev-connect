'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Shield, Users, AlertTriangle, BarChart, Activity } from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState<{ users: number; reports: number; activeSessions: number } | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ stats: typeof stats }>('/admin/stats', token)
      .then((d) => setStats(d.stats)).catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><Shield size={20} className="mr-2 inline" /> Admin</h1>
      <p className="text-sm text-muted-foreground">Platform control and monitoring.</p>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users size={24} className="mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats?.users ?? 0}</p>
            <p className="text-sm text-muted-foreground">Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangle size={24} className="mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold">{stats?.reports ?? 0}</p>
            <p className="text-sm text-muted-foreground">Open Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity size={24} className="mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{stats?.activeSessions ?? 0}</p>
            <p className="text-sm text-muted-foreground">Active Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BarChart size={24} className="mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">--</p>
            <p className="text-sm text-muted-foreground">API Calls (24h)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/safety"><Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle size={20} className="text-warning" />
            <div>
              <p className="font-semibold">Safety & Moderation</p>
              <p className="text-xs text-muted-foreground">Review reports and flagged content</p>
            </div>
          </CardContent>
        </Card></Link>
        <Link href="/audit-logs"><Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="pt-6 flex items-center gap-3">
            <Activity size={20} className="text-primary" />
            <div>
              <p className="font-semibold">Audit Logs</p>
              <p className="text-xs text-muted-foreground">View platform activity history</p>
            </div>
          </CardContent>
        </Card></Link>
        <Link href="/analytics"><Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="pt-6 flex items-center gap-3">
            <BarChart size={20} className="text-accent" />
            <div>
              <p className="font-semibold">Analytics</p>
              <p className="text-xs text-muted-foreground">Usage metrics and engagement stats</p>
            </div>
          </CardContent>
        </Card></Link>
      </div>
    </div>
  );
}
