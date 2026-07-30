'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Bell, Eye, LogOut, Trash2, Download, Shield, Database, Settings2 } from 'lucide-react';
import { SettingsSkeleton } from '@/components/skeletons';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { token, logout, user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const [notifications, setNotifications] = useState({ email: true, push: false, digest: false });
  const [isPublic, setIsPublic] = useState(true);
  const [chatRetention, setChatRetention] = useState('permanent');
  const [swipeRetention, setSwipeRetention] = useState('permanent');

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.get<any>('/users/me', token).catch(() => ({})),
      api.get<any[]>('/notifications/preferences', token).catch(() => []),
    ]).then(([userData, prefs]) => {
      const p = userData.profile || userData;
      if (p.isPublic !== undefined) setIsPublic(p.isPublic);
      if (p.preferences?.chatRetention) setChatRetention(p.preferences.chatRetention);
      if (p.preferences?.swipeRetention) setSwipeRetention(p.preferences.swipeRetention);
      if (p.displayName) setEmail(userData.email || '');
      if (Array.isArray(prefs)) {
        const emailPref = prefs.find((pr) => pr.channel === 'EMAIL');
        const pushPref = prefs.find((pr) => pr.channel === 'PUSH');
        setNotifications({
          email: emailPref ? emailPref.enabled : true,
          push: pushPref ? pushPref.enabled : false,
          digest: true,
        });
      }
    }).finally(() => setLoading(false));
  }, [token]);

  async function toggleNotification(type: string, channel: string, enabled: boolean) {
    try {
      await api.post('/notifications/preferences', { type, channel, enabled }, token!);
      toast.success('Preference saved');
    } catch { toast.error('Failed to save'); }
  }

  async function toggleVisibility() {
    const next = !isPublic;
    setIsPublic(next);
    try {
      await api.patch('/users/me/profile', { preferences: { isPublic: next } }, token!);
      toast.success(next ? 'Profile visible in Discover' : 'Profile hidden from Discover');
    } catch { setIsPublic(!next); toast.error('Failed to update visibility'); }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !newPassword) return toast.error('Fill all fields');
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    try {
      await api.post('/auth/change-password', { currentPassword: password, newPassword }, token!);
      toast.success('Password changed');
      setPassword('');
      setNewPassword('');
    } catch { toast.error('Failed to change password'); }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await api.put('/users/email', { email }, token ?? undefined);
      toast.success('Email updated');
    } catch { toast.error('Failed to update email'); }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return;
    try {
      await api.delete('/auth/account', token!);
      logout();
      toast.success('Account deleted');
      window.location.href = '/';
    } catch { toast.error('Failed to delete account'); }
  }

  async function handleExportData() {
    try {
      const data = await api.get('/auth/export', token!);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devconnect-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported');
    } catch { toast.error('Failed to export data'); }
  }

  async function handleLogout() {
    try { await api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }, token!); } catch {}
    logout();
    window.location.href = '/';
  }

  async function updateRetention(type: 'chatRetention' | 'swipeRetention', value: string) {
    if (type === 'chatRetention') setChatRetention(value);
    else setSwipeRetention(value);
    try {
      await api.patch('/users/me/profile', { preferences: { [type]: value } }, token!);
      toast.success('Retention preference saved');
    } catch { toast.error('Failed to save'); }
  }

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      {/* Account */}
      <Card>
        <CardHeader><CardTitle><Settings2 size={16} className="mr-1 inline" /> Account</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={handleChangeEmail} className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <div className="flex gap-2">
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <Button type="submit" size="sm">Update</Button>
            </div>
          </form>
          <form onSubmit={handleChangePassword} className="space-y-2">
            <label htmlFor="current-password" className="text-sm font-medium">Current Password</label>
            <input id="current-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Current password"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <label htmlFor="new-password" className="text-sm font-medium">New Password</label>
            <input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <Button type="submit" size="sm">Change Password</Button>
          </form>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader><CardTitle><Shield size={16} className="mr-1 inline" /> Privacy</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between text-sm">
            <span>Show my profile in Discover</span>
            <input type="checkbox" checked={isPublic} onChange={toggleVisibility} className="rounded" />
          </label>
          <p className="text-xs text-muted-foreground">
            When disabled, your profile will not appear in the Discover feed or search results.
          </p>
          <hr className="border-border" />
          <div className="space-y-2">
            <label className="text-sm font-medium">Allow messages from</label>
            <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
              defaultValue="everyone">
              <option value="everyone">Everyone</option>
              <option value="matches">Matches only</option>
            </select>
          </div>
          <label className="flex items-center justify-between text-sm">
            <span>Show online status</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
        </CardContent>
      </Card>

      {/* Data Preferences */}
      <Card>
        <CardHeader><CardTitle><Database size={16} className="mr-1 inline" /> Data Preferences</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Chat retention</label>
            <select value={chatRetention} onChange={(e) => updateRetention('chatRetention', e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none">
              <option value="permanent">Keep forever</option>
              <option value="30_days">Auto-delete after 30 days</option>
              <option value="90_days">Auto-delete after 90 days</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Swipe history retention</label>
            <select value={swipeRetention} onChange={(e) => updateRetention('swipeRetention', e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none">
              <option value="permanent">Keep forever</option>
              <option value="30_days">Auto-delete after 30 days</option>
              <option value="90_days">Auto-delete after 90 days</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">
            Data will be automatically cleaned up based on your retention preferences.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle><Bell size={16} className="mr-1 inline" /> Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'MATCH', channel: 'EMAIL', label: 'Email Notifications', checked: notifications.email,
              onChange: (v: boolean) => { setNotifications((n) => ({ ...n, email: v })); toggleNotification('MATCH', 'EMAIL', v); } },
            { key: 'MESSAGE', channel: 'PUSH', label: 'Push Notifications', checked: notifications.push,
              onChange: (v: boolean) => { setNotifications((n) => ({ ...n, push: v })); toggleNotification('MESSAGE', 'PUSH', v); } },
            { key: 'SYSTEM', channel: 'IN_APP', label: 'In-app Notifications', checked: notifications.digest,
              onChange: (v: boolean) => { setNotifications((n) => ({ ...n, digest: v })); toggleNotification('SYSTEM', 'IN_APP', v); } },
          ].map(({ key, channel, label, checked, onChange }) => (
            <label key={`${key}-${channel}`} className="flex items-center justify-between text-sm">
              <span>{label}</span>
              <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded" />
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-danger/30">
        <CardHeader><CardTitle className="text-danger"><Trash2 size={16} className="mr-1 inline" /> Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={handleExportData}>
              <Download size={14} className="mr-1" /> Export My Data
            </Button>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              <LogOut size={14} className="mr-1" /> Log Out
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <Trash2 size={14} className="mr-1" /> Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader><CardTitle className="text-danger">Delete Account</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will immediately hide your profile and revoke all sessions.
                Your data will be permanently deleted after 30 days.
                This action cannot be undone.
              </p>
              <p className="text-sm font-medium">Type <span className="font-bold text-danger">DELETE</span> to confirm:</p>
              <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-danger"
                placeholder="Type DELETE" />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}>
                  Cancel
                </Button>
                <Button variant="danger" disabled={deleteConfirm !== 'DELETE'} onClick={handleDeleteAccount}>
                  Delete My Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
