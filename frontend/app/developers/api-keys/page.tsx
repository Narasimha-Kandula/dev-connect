'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Key, Plus, Copy, Trash2 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ keys: ApiKey[] }>('/developers/api-keys', token)
      .then((d) => setKeys(d.keys ?? []))
      .catch(() => {});
  }, [token]);

  async function handleGenerate() {
    if (!token) return;
    try {
      const created = await api.post<ApiKey & { rawKey: string }>('/developers/api-keys', { name: `Key ${keys.length + 1}` }, token);
      setKeys((prev) => [...prev, created]);
      setNewKey(created.rawKey);
      setTimeout(() => setNewKey(''), 10000);
    } catch {}
  }

  async function handleRevoke(id: string) {
    if (!token) return;
    try {
      await api.delete(`/developers/api-keys/${id}`, token);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {}
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight"><Key size={20} className="mr-2 inline" /> API Keys</h1>
        <Button onClick={handleGenerate}><Plus size={14} className="mr-1" /> Generate Key</Button>
      </div>

      {newKey && (
        <Card className="border-success">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex-1">
              <p className="text-sm font-semibold text-success">Key generated — copy it now</p>
              <code className="mt-1 block rounded bg-muted px-3 py-2 text-xs break-all">{newKey}</code>
            </div>
            <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(newKey); }}>
              <Copy size={14} />
            </Button>
          </CardContent>
        </Card>
      )}

      {keys.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No API keys yet. Generate one to get started.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {keys.map((k) => (
          <Card key={k.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="font-semibold text-sm">{k.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{k.keyPreview}…</p>
                <p className="text-xs text-muted-foreground">Created {new Date(k.createdAt).toLocaleDateString()}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleRevoke(k.id)}><Trash2 size={14} className="text-danger" /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
