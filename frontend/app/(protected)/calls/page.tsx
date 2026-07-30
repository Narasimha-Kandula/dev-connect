'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Phone, PhoneMissed, Clock, Video } from 'lucide-react';
import Link from 'next/link';

interface CallLog {
  id: string;
  withName: string;
  duration: string;
  type: 'audio' | 'video';
  missed: boolean;
  date: string;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ calls: CallLog[] }>('/calls', token)
      .then((d) => setCalls(d.calls ?? []))
      .catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Phone size={20} className="text-primary" /> Call History
      </h1>

      {calls.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No calls yet. Start a video or audio call from a match chat.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {calls.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${c.missed ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                {c.missed ? <PhoneMissed size={16} /> : <Phone size={16} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{c.withName}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">{c.type === 'video' ? <Video size={10} /> : <Phone size={10} />} {c.type}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {c.duration}</span>
                  <span>{c.date}</span>
                </div>
              </div>
              <Link href={`/call/${c.id}`}>
                <Button size="sm"><Phone size={14} className="mr-1" /> Call Back</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
