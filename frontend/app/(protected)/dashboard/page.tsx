'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Compass, Plus, MessageCircle, Sparkles, Activity, Bell } from 'lucide-react';
import { DashboardSkeleton } from '@/components/skeletons';

export default function DashboardPage() {
  const { token, user } = useAuthStore();
  const [userName, setUserName] = useState('there');
  const [completeness, setCompleteness] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentMatches, setRecentMatches] = useState<Array<{ id: string; userOne?: { profile?: { displayName?: string } }; userTwo?: { profile?: { displayName?: string } } }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setUserName(user?.profile?.displayName ?? 'there');
    setCompleteness(user?.profile?.profileCompleteness ?? 0);

    Promise.allSettled([
      api.get<Array<{ id: string }>>('/matches', token),
      api.get<Array<{ id: string }>>('/chat/conversations', token),
      api.get<Array<{ id: string }>>('/notifications?limit=1', token),
    ]).then(([matchesResult, convResult, notifResult]) => {
      if (matchesResult.status === 'fulfilled') {
        const matches = matchesResult.value ?? [];
        setMatchCount(matches.length);
        setRecentMatches(matches.slice(0, 5));
      }
      if (convResult.status === 'fulfilled') setConversationCount(convResult.value?.length ?? 0);
      if (notifResult.status === 'fulfilled') setNotificationCount(notifResult.value?.length ?? 0);
    }).finally(() => setLoading(false));
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
            {loading ? (
              <div className="mt-2 h-8 w-12 animate-pulse rounded bg-muted" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-match">{matchCount}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Unread Messages</p>
            {loading ? (
              <div className="mt-2 h-8 w-12 animate-pulse rounded bg-muted" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-accent">{conversationCount}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Notifications</p>
            {loading ? (
              <div className="mt-2 h-8 w-12 animate-pulse rounded bg-muted" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-warning">{notificationCount}</p>
            )}
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
            {matchCount > 0
              ? `You have ${matchCount} active match${matchCount === 1 ? '' : 'es'}. Check your matches for details.`
              : 'No matches yet — head to Discover to find your next collaborator.'}
            {recentMatches.length > 0 && (
              <div className="mt-3 space-y-2">
                {recentMatches.map((m) => {
                  const other = user?.id === (m as Record<string, unknown> & { userOneId?: string }).userOneId
                    ? m.userTwo : m.userOne;
                  return (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <div className="h-6 w-6 rounded-full bg-muted text-center text-[10px] leading-6 font-medium">
                        {other?.profile?.displayName?.charAt(0) ?? '?'}
                      </div>
                      <span>{other?.profile?.displayName ?? 'Developer'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><Activity size={16} className="mr-1 inline" /> Activity Snapshot</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {completeness < 100
              ? 'Complete your profile to unlock full platform features.'
              : 'Your profile is complete! Start exploring matches and projects.'}
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
