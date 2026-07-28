'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Compass, Plus, MessageCircle, Sparkles, Activity, Bell } from 'lucide-react';

export default function DashboardPage() {
  const { token, user } = useAuthStore();
  const [userName, setUserName] = useState('there');
  const [completeness, setCompleteness] = useState(0);
  const [stats, setStats] = useState({ matches: 0, messages: 0, invites: 0 });

  useEffect(() => {
    if (!token) return;
    setUserName(user?.profile?.displayName ?? 'there');
    setCompleteness(user?.profile?.profileCompleteness ?? 0);
    api.get<{ matches?: number; unreadMessages?: number; pendingInvites?: number }>('/matches', token)
      .then((d) => setStats({ matches: d.matches ?? 0, messages: d.unreadMessages ?? 0, invites: d.pendingInvites ?? 0 }))
      .catch(() => {});
  }, [token, user]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good to see you, {userName}.</h1>
          <p className="text-muted-foreground">Here is your network activity snapshot.</p>
        </div>
        <Link href="/onboarding"><Button variant="secondary" size="sm"><Sparkles size={14} className="mr-1" /> Complete Profile</Button></Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Profile Completeness</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-bold text-primary">{completeness}%</p>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${completeness}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Matches</p>
            <p className="mt-2 text-3xl font-bold text-match">{stats.matches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Unread Messages</p>
            <p className="mt-2 text-3xl font-bold text-accent">{stats.messages}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending Invites</p>
            <p className="mt-2 text-3xl font-bold text-warning">{stats.invites}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/discover"><Button><Compass size={16} className="mr-1" /> Discover Developers</Button></Link>
        <Link href="/projects/create"><Button variant="secondary"><Plus size={16} className="mr-1" /> Create Project</Button></Link>
        <Link href="/chat"><Button variant="secondary"><MessageCircle size={16} className="mr-1" /> Messages</Button></Link>
        <Link href="/notifications"><Button variant="ghost"><Bell size={16} className="mr-1" /> Notifications</Button></Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Matches</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No matches yet — head to Discover to find your next collaborator.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><Activity size={16} className="mr-1 inline" /> Activity Snapshot</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>No recent activity. Start by completing your profile.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle><Sparkles size={16} className="mr-1 inline" /> AI Suggestions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Complete your profile to get personalized developer and project recommendations.
          </p>
          <Link href="/recommendations"><Button variant="secondary" size="sm">View Suggestions</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
