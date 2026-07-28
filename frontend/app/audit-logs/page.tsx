'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ClipboardList, Download, Filter } from 'lucide-react';

interface Log {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  user?: { email: string };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [entityFilter, setEntityFilter] = useState('all');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ logs: Log[] }>(`/admin/audit-logs${entityFilter !== 'all' ? `?entity=${entityFilter}` : ''}`, token)
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => {});
  }, [token, entityFilter]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><ClipboardList size={20} className="mr-2 inline" /> Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Track platform activity for compliance.</p>
        </div>
        <Button variant="secondary" size="sm"><Download size={14} className="mr-1" /> Export</Button>
      </div>

      <div className="flex gap-2">
        {['all', 'user', 'project', 'auth', 'admin'].map((e) => (
          <button key={e} onClick={() => setEntityFilter(e)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${entityFilter === e ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {e}
          </button>
        ))}
      </div>

      {logs.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No audit logs available.
          </CardContent>
        </Card>
      )}

      <div className="space-y-1">
        {logs.map((l) => (
          <div key={l.id} className="flex items-center gap-4 rounded-lg border border-border px-4 py-3 text-sm">
            <span className="font-medium capitalize">{l.action}</span>
            <span className="text-muted-foreground">{l.entity}</span>
            <span className="ml-auto text-xs text-muted-foreground">{l.user?.email ?? 'System'}</span>
            <span className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
