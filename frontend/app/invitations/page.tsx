'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Check, X, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Invitation {
  id: string;
  sender?: { displayName: string };
  receiver?: { displayName: string };
  project?: { title: string };
  status: string;
  createdAt: string;
}

export default function InvitationsPage() {
  const [incoming, setIncoming] = useState<Invitation[]>([]);
  const [sent, setSent] = useState<Invitation[]>([]);
  const [tab, setTab] = useState<'incoming' | 'sent'>('incoming');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ invitations: Invitation[] }>('/invitations', token)
      .then((d) => {
        const all = d.invitations ?? [];
        setIncoming(all.filter((i) => i.status === 'PENDING' && i.sender));
        setSent(all.filter((i) => i.receiver));
      })
      .catch(() => {});
  }, [token]);

  async function handleAction(id: string, action: 'accepted' | 'rejected') {
    if (!token) return;
    try {
      await api.put(`/invitations/${id}`, { status: action }, token);
      setIncoming((prev) => prev.filter((i) => i.id !== id));
    } catch {}
  }

  const list = tab === 'incoming' ? incoming : sent;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Invitations</h1>

      <div className="flex gap-2">
        <button onClick={() => setTab('incoming')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'incoming' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          Incoming ({incoming.length})
        </button>
        <button onClick={() => setTab('sent')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'sent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          Sent ({sent.length})
        </button>
      </div>

      {list.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {tab === 'incoming' ? 'No pending invitations.' : 'No sent invitations.'}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {list.map((inv) => (
          <Card key={inv.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-semibold text-sm">
                  {tab === 'incoming' ? inv.sender?.displayName : inv.receiver?.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {inv.project ? `Project: ${inv.project.title}` : 'Collaboration request'}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  inv.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                  inv.status === 'ACCEPTED' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                }`}>
                  <Clock size={10} /> {inv.status}
                </span>
              </div>
              {tab === 'incoming' && inv.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAction(inv.id, 'accepted')}><Check size={14} className="mr-1" /> Accept</Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAction(inv.id, 'rejected')}><X size={14} className="mr-1" /> Reject</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
