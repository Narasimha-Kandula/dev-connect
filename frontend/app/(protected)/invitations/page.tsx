'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Send, Check, X, Clock, Mail, UserCheck, UserX, Loader2 } from 'lucide-react';

interface InviteUser {
  displayName: string;
  headline?: string;
  avatarUrl?: string;
}

interface Invitation {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  respondedAt?: string;
  sender: { id: string; profile: InviteUser | null };
  receiver: { id: string; profile: InviteUser | null };
}

export default function InvitationsPage() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const [received, setReceived] = useState<Invitation[]>([]);
  const [sent, setSent] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get<Invitation[]>('/invite/received', token).then((d) => setReceived(Array.isArray(d) ? d : [])),
      api.get<Invitation[]>('/invite/sent', token).then((d) => setSent(Array.isArray(d) ? d : [])),
    ]).finally(() => setLoading(false));
  }, [token]);

  async function respond(inviteId: string, action: 'ACCEPTED' | 'REJECTED') {
    if (!token) return;
    setResponding(inviteId);
    try {
      await api.post(`/invite/${inviteId}/respond`, { action }, token);
      setReceived((prev) => prev.map((i) => i.id === inviteId ? { ...i, status: action, respondedAt: new Date().toISOString() } : i));
    } catch {}
    setResponding(null);
  }

  const list = tab === 'received' ? received : sent;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mail size={20} className="text-primary" /> Invitations
        </h1>
        <p className="text-sm text-muted-foreground">Manage collaboration requests.</p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('received')}
          className={`pb-3 text-sm font-medium ${tab === 'received' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
        >
          Received ({received.filter((i) => i.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`pb-3 text-sm font-medium ${tab === 'sent' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
        >
          Sent ({sent.length})
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {tab === 'received' ? 'No invitations yet.' : 'No invitations sent.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((inv) => {
            const isReceived = tab === 'received';
            const person = isReceived ? inv.sender : inv.receiver;
            const profile = person?.profile;
            const name = profile?.displayName ?? 'Unknown';
            const otherUserId = isReceived ? inv.senderId : inv.receiverId;

            return (
              <Card key={inv.id} className={inv.status === 'PENDING' ? 'border-primary/30' : ''}>
                <CardContent className="flex items-center gap-4 pt-6">
                  <Link href={`/profile/${otherUserId}`}>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-primary">
                      {name.charAt(0)}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${otherUserId}`} className="font-semibold hover:underline">{name}</Link>
                      {profile?.headline && <span className="text-sm text-muted-foreground">· {profile.headline}</span>}
                    </div>
                    {inv.message && <p className="text-sm text-muted-foreground">&ldquo;{inv.message}&rdquo;</p>}
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                      {inv.status === 'PENDING' && <span className="flex items-center gap-1 text-amber-500"><Clock size={12} /> Pending</span>}
                      {inv.status === 'ACCEPTED' && <span className="flex items-center gap-1 text-success"><UserCheck size={12} /> Accepted</span>}
                      {inv.status === 'REJECTED' && <span className="flex items-center gap-1 text-danger"><UserX size={12} /> Declined</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {isReceived && inv.status === 'PENDING' && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => respond(inv.id, 'ACCEPTED')} disabled={responding === inv.id}>
                          {responding === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          <span className="ml-1 hidden sm:inline">Accept</span>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => respond(inv.id, 'REJECTED')} disabled={responding === inv.id}>
                          <X size={14} />
                          <span className="ml-1 hidden sm:inline">Decline</span>
                        </Button>
                      </>
                    )}
                    {!isReceived && inv.status === 'ACCEPTED' && (
                      <Link href="/chat"><Button size="sm" variant="secondary"><Send size={14} className="mr-1" /> Message</Button></Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
