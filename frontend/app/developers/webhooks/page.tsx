'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Webhook, Plus, Trash2, Activity } from 'lucide-react';

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ webhooks: WebhookEndpoint[] }>('/developers/webhooks', token)
      .then((d) => setWebhooks(d.webhooks ?? []))
      .catch(() => {});
  }, [token]);

  async function handleCreate() {
    if (!newUrl.trim() || !token) return;
    try {
      const created = await api.post<WebhookEndpoint>('/developers/webhooks', {
        url: newUrl,
        events: ['match.created', 'message.sent', 'invitation.received'],
      }, token);
      setWebhooks((prev) => [...prev, created]);
      setNewUrl('');
      setShowForm(false);
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!token) return;
    try {
      await api.delete(`/developers/webhooks/${id}`, token);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch {}
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><Webhook size={20} className="mr-2 inline" /> Webhooks</h1>
          <p className="text-sm text-muted-foreground">Receive real-time events via HTTP callbacks.</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus size={14} className="mr-1" /> Add Endpoint</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="flex gap-3 pt-6">
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-app.com/webhook"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <Button onClick={handleCreate}>Create</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      {webhooks.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No webhook endpoints configured.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {webhooks.map((w) => (
          <Card key={w.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${w.active ? 'bg-success' : 'bg-muted-foreground'}`} />
                    <code className="text-sm truncate">{w.url}</code>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {w.events.map((e) => (
                      <span key={e} className="rounded-full bg-muted px-2 py-0.5 text-xs">{e}</span>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(w.id)}><Trash2 size={14} className="text-danger" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
