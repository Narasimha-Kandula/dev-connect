'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Bell, Eye, Palette, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';

export default function SettingsPage() {
  const { token, logout } = useAuthStore();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({ email: true, push: false, digest: false });

  useEffect(() => {
    if (!token) return;
    api.get<{ notifications?: { email?: boolean; push?: boolean; digest?: boolean } }>('/users/me', token)
      .then((d) => {
        if (d.notifications) {
          setNotifications({
            email: d.notifications.email ?? true,
            push: d.notifications.push ?? false,
            digest: d.notifications.digest ?? false,
          });
        }
      })
      .catch(() => {});
  }, [token]);

  async function handleNotificationToggle(key: 'email' | 'push' | 'digest', value: boolean) {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    if (!token) return;
    try {
      await api.put('/users/me/preferences', { notifications: next }, token ?? undefined);
    } catch {
      toast.error('Failed to save preferences');
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api.put('/users/email', { email }, token ?? undefined);
      setMsg('Email updated successfully.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to update email');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Card>
        <CardHeader><CardTitle><Bell size={16} className="mr-1 inline" /> Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([['email', 'Email Notifications'], ['push', 'Push Notifications'], ['digest', 'Weekly Digest']] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between text-sm">
              <span>{label}</span>
              <input type="checkbox" checked={notifications[key as keyof typeof notifications]} onChange={(e) => handleNotificationToggle(key, e.target.checked)} className="rounded" />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><Eye size={16} className="mr-1 inline" /> Privacy</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Control who can see your profile and activity.</p>
          <Link href="/security"><Button variant="secondary" size="sm">Privacy & Security</Button></Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><Palette size={16} className="mr-1 inline" /> Appearance</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use the theme toggle in the navigation bar to switch between light and dark mode.
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleChangeEmail} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Change Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="new@example.com" />
            </div>
            {msg && <p className="text-sm text-success">{msg}</p>}
            <Button type="submit" size="sm">Update Email</Button>
          </form>

          <hr className="border-border" />

          <Button variant="danger" size="sm"
            onClick={() => { logout(); window.location.href = '/'; }}
          >
            <LogOut size={14} className="mr-1" /> Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
