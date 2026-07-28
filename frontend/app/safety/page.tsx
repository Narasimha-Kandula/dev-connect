'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AlertTriangle, Flag, Check, X } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  reason: string;
  targetType: string;
  status: string;
  createdAt: string;
}

export default function SafetyPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ reports: Report[] }>('/admin/reports', token)
      .then((d) => setReports(d.reports ?? []))
      .catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><AlertTriangle size={20} className="mr-2 inline" /> Safety & Moderation</h1>
          <p className="text-sm text-muted-foreground">Review and act on user reports.</p>
        </div>
        <Link href="/blocked"><Button variant="secondary" size="sm">Blocked Users</Button></Link>
      </div>

      {reports.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No pending reports.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {reports.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-start gap-4 pt-6">
              <Flag size={16} className="mt-1 shrink-0 text-warning" />
              <div className="flex-1">
                <p className="text-sm font-medium">Report: {r.reason}</p>
                <p className="text-xs text-muted-foreground">{r.targetType} · {new Date(r.createdAt).toLocaleDateString()}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.status === 'pending' ? 'bg-warning/10 text-warning' : r.status === 'reviewed' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'
                }`}>{r.status}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary"><Check size={14} /></Button>
                <Button size="sm" variant="ghost"><X size={14} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
