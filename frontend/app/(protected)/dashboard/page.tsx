'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Compass, Plus, MessageCircle, Sparkles, Activity, Bell, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Avatar } from '@/lib/avatar';

export default function DashboardPage() {
  const { token, user } = useAuthStore();
  const [userName, setUserName] = useState('there');
  const [completeness, setCompleteness] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [invitationCount, setInvitationCount] = useState(0);
  const [recentMatches, setRecentMatches] = useState<Array<{ id: string; userOne?: { profile?: { displayName?: string } }; userTwo?: { profile?: { displayName?: string } } }>>([]);
  const [loading, setLoading] = useState(true);
  const [animatedCompleteness, setAnimatedCompleteness] = useState(0);
  const completenessRef = useRef(0);

  // Animate the completeness number from previous value to new value
  useEffect(() => {
    const target = completeness;
    const start = completenessRef.current;
    const duration = 800; // ms
    const startTime = performance.now();
    let mounted = true;

    if (start === target) {
      setAnimatedCompleteness(target);
      return;
    }

    function step(now: number) {
      if (!mounted) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic: 1 - (1-t)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      setAnimatedCompleteness(current);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
    completenessRef.current = target;

    return () => { mounted = false; };
  }, [completeness]);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setUserName(user?.profile?.displayName ?? 'there');
    const profileCompleteness = user?.profile?.profileCompleteness ?? 0;
    setCompleteness(profileCompleteness);
    completenessRef.current = profileCompleteness;

    Promise.allSettled([
      api.get<Array<{ id: string }>>('/matches', token),
      api.get<Array<{ id: string }>>('/chat/conversations', token),
      api.get<Array<{ id: string }>>('/notifications?limit=1', token),
      api.get<Array<{ id: string; status: string }>>('/invite/received?status=PENDING', token).catch(() => []),
    ]).then(([matchesResult, convResult, notifResult, inviteResult]) => {
      if (!mounted) return;
      if (matchesResult.status === 'fulfilled') {
        const matches = matchesResult.value ?? [];
        setMatchCount(matches.length);
        setRecentMatches(matches.slice(0, 5));
      }
      if (convResult.status === 'fulfilled') setConversationCount(convResult.value?.length ?? 0);
      if (notifResult.status === 'fulfilled') setNotificationCount(notifResult.value?.length ?? 0);
      if (inviteResult.status === 'fulfilled') setInvitationCount(inviteResult.value?.length ?? 0);
    }).finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [token, user]);

  // Derive completion stage, color, and label
  const completionInfo = useMemo(() => {
    if (completeness >= 100) return { label: 'Complete!', color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2, stage: 4 };
    if (completeness >= 75) return { label: 'Almost done!', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Sparkles, stage: 3 };
    if (completeness >= 50) return { label: 'Building momentum', color: 'text-primary', bg: 'bg-primary/10', icon: Activity, stage: 2 };
    if (completeness >= 25) return { label: 'Getting started', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: AlertTriangle, stage: 1 };
    return { label: 'Just joined!', color: 'text-danger', bg: 'bg-danger/10', icon: AlertTriangle, stage: 0 };
  }, [completeness]);

  const StageIcon = completionInfo.icon;

  // Progress ring SVG
  const ringRadius = 28;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (animatedCompleteness / 100) * ringCircumference;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      {/* Header with progress ring */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          {/* Circular progress ring */}
          <div className="relative shrink-0">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={ringRadius} fill="none" stroke="currentColor" className="text-muted-foreground/20" strokeWidth="5" />
              <circle
                cx="32" cy="32" r={ringRadius}
                fill="none"
                stroke="currentColor"
                className={completeness >= 100 ? 'text-success' : completeness >= 75 ? 'text-emerald-500' : completeness >= 50 ? 'text-primary' : completeness >= 25 ? 'text-amber-500' : 'text-danger'}
                strokeWidth="5"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
              {animatedCompleteness}%
            </span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Good to see you, {userName}.</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${completionInfo.bg} ${completionInfo.color}`}>
                <StageIcon size={12} />
                {completionInfo.label}
              </span>
              <p className="text-sm text-muted-foreground tabular-nums">{animatedCompleteness}% complete</p>
            </div>
          </div>
        </div>
        {completeness < 100 ? (
          <Link href="/onboarding" className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" className="w-full sm:w-auto gap-1.5">
              <Sparkles size={14} />
              Complete Profile
              <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${completionInfo.bg} ${completionInfo.color}`}>
                {completeness}%
              </span>
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" size="sm" disabled className="opacity-60 cursor-default w-full sm:w-auto">
            <CheckCircle2 size={14} className="mr-1 text-success" /> Profile Complete
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Profile Completeness</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-3xl font-bold text-primary tabular-nums transition-opacity duration-300">
                {animatedCompleteness}%
              </p>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${animatedCompleteness}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              />
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
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Invitations</p>
            {loading ? (
              <div className="mt-2 h-8 w-12 animate-pulse rounded bg-muted" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-primary">{invitationCount}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        <Link href="/discover" className="w-full sm:w-auto"><Button className="w-full sm:w-auto"><Compass size={16} className="mr-1" /> Discover Developers</Button></Link>
        <Link href="/projects/create" className="w-full sm:w-auto"><Button variant="secondary" className="w-full sm:w-auto"><Plus size={16} className="mr-1" /> Create Project</Button></Link>
        <Link href="/chat" className="w-full sm:w-auto"><Button variant="secondary" className="w-full sm:w-auto"><MessageCircle size={16} className="mr-1" /> Messages</Button></Link>
        <Link href="/notifications" className="w-full sm:w-auto"><Button variant="ghost" className="w-full sm:w-auto"><Bell size={16} className="mr-1" /> Notifications</Button></Link>
        <Link href="/invitations" className="w-full sm:w-auto"><Button variant="ghost" className="w-full sm:w-auto"><Mail size={16} className="mr-1" /> Invitations</Button></Link>
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
                      <Avatar src={null} name={other?.profile?.displayName ?? '?'} size="xs" />
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

      {/* Profile Completion Checklist */}
      {completeness < 100 && (
        <Card>
          <CardHeader><CardTitle><CheckCircle2 size={16} className="mr-1.5 inline" /> Completion Checklist</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              Complete these items to reach 100% and unlock all platform features.
            </p>
            {[
              { key: 'displayName', label: 'Add your display name', done: completeness >= 10 },
              { key: 'avatar', label: 'Upload a profile photo', done: completeness >= 25 },
              { key: 'headline', label: 'Write a headline', done: completeness >= 40 },
              { key: 'bio', label: 'Add your bio', done: completeness >= 55 },
              { key: 'skills', label: 'List your skills', done: completeness >= 70 },
              { key: 'location', label: 'Set your location', done: completeness >= 85 },
              { key: 'socials', label: 'Connect GitHub or LinkedIn', done: completeness >= 95 },
            ].map((item) => (
              <div key={item.key} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${item.done ? 'text-muted-foreground/60' : 'hover:bg-muted/20'}`}>
                {item.done ? (
                  <CheckCircle2 size={16} className="shrink-0 text-success" />
                ) : (
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  </div>
                )}
                <span className={item.done ? 'line-through' : ''}>{item.label}</span>
                {item.done && <span className="ml-auto text-[11px] text-success">Done</span>}
              </div>
            ))}
            <div className="pt-3">
              <Link href="/onboarding">
                <Button size="sm" variant="secondary" className="w-full gap-1.5">
                  <Sparkles size={14} />
                  Continue Setup
                  <span className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold`}>
                    {completeness}%
                  </span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle><Sparkles size={16} className="mr-1 inline" /> AI Suggestions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {completeness < 100 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Complete your profile to get personalized developer and project recommendations.
              </p>
              <Link href="/onboarding"><Button variant="secondary" size="sm"><Sparkles size={14} className="mr-1" /> Complete Profile</Button></Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Your profile is complete! Discover AI-powered recommendations tailored to your skills.
              </p>
              <Link href="/recommendations"><Button variant="secondary" size="sm">View Suggestions</Button></Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
