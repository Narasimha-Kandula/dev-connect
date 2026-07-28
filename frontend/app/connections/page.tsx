'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { MessageCircle, User, Tag } from 'lucide-react';

interface Connection {
  id: string;
  displayName: string;
  headline?: string;
  tag?: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ connections: Connection[] }>('/matching/connections', token)
      .then((d) => setConnections(d.connections ?? []))
      .catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
      <p className="text-sm text-muted-foreground">Your accepted network — team members, collaborators, and recruiters.</p>

      {connections.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No connections yet. Match with developers to build your network.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {connections.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-base font-bold text-primary">
                  {c.displayName?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="font-semibold">{c.displayName}</p>
                  <p className="text-sm text-muted-foreground">{c.headline ?? 'Developer'}</p>
                  {c.tag && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                      <Tag size={10} /> {c.tag}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/chat?userId=${c.id}`}><Button size="sm"><MessageCircle size={14} className="mr-1" /> Message</Button></Link>
                <Link href={`/profile/${c.id}`}><Button variant="secondary" size="sm"><User size={14} /></Button></Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
