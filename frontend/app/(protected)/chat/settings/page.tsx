'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, Eye, Ban } from 'lucide-react';

export default function ChatSettingsPage() {
  const [prefs, setPrefs] = useState({ messageSound: true, preview: true, typingIndicators: true, readReceipts: true });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <Link href="/chat" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Messages
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Chat Settings</h1>

      <Card>
        <CardHeader><CardTitle><Bell size={16} className="mr-1 inline" /> Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([['messageSound', 'Message Sound'], ['preview', 'Message Preview'], ['typingIndicators', 'Typing Indicators'], ['readReceipts', 'Read Receipts']] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between text-sm">
              <span>{label}</span>
              <input type="checkbox" checked={prefs[key]} onChange={(e) => setPrefs(p => ({ ...p, [key]: e.target.checked }))} className="rounded" />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><Eye size={16} className="mr-1 inline" /> Privacy</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">Control who can message you and see your online status.</p>
          <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option>Everyone</option>
            <option>Matches Only</option>
            <option>No One</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><Ban size={16} className="mr-1 inline" /> Blocked Users</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No blocked users.</p>
          <Link href="/blocked"><Button variant="secondary" size="sm" className="mt-2">Manage Blocked Users</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
