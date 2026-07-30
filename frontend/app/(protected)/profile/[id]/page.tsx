'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { ArrowLeft, MessageCircle, ThumbsUp, MapPin, Star, Shield, ExternalLink, Send, Ban, Flag, Bookmark, BookmarkCheck, AlertTriangle } from 'lucide-react';
import { ProfileSkeleton } from '@/components/skeletons';
import { toast } from 'sonner';
import Link from 'next/link';
import { Avatar } from '@/lib/avatar';

interface PublicProfile {
  id: string;
  userId: string;
  displayName: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  experienceLevel?: string;
  availability?: string;
  reputationScore: number;
  skills: { skill: { name: string }; proficiency: number }[];
  portfolioLinks?: { label: string; url: string }[];
  githubUsername?: string;
}

interface BlockedEntry { id: string; blockedId: string }
interface SavedEntry { id: string; savedUserId: string }

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swiping, setSwiping] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  const userId = params.id as string;

  useEffect(() => {
    if (!userId || !token) return;
    Promise.all([
      api.get<PublicProfile>(`/users/${userId}/profile`, token),
      api.get<BlockedEntry[]>('/users/me/blocked', token).catch(() => []),
      api.get<SavedEntry[]>('/users/me/saved', token).catch(() => []),
      api.get<{ id: string; receiverId: string; status: string }[]>('/invite/sent', token).catch(() => []),
    ]).then(([profile, blocked, saved, sent]) => {
      setProfile(profile);
      setIsBlocked(blocked.some((b: BlockedEntry) => b.blockedId === userId));
      setIsSaved(saved.some((s: SavedEntry) => s.savedUserId === userId));
      if (sent.some((i) => i.receiverId === userId)) setInviteSent(true);
    }).catch(() => setError('Profile not found'))
      .finally(() => setLoading(false));
  }, [userId, token]);

  async function handleSwipeLike() {
    if (!token || swiping) return;
    setSwiping(true);
    try {
      await api.post('/discover/swipe', { targetId: userId, action: 'LIKE' }, token);
      router.push('/matches');
    } catch {}
    setSwiping(false);
  }

  async function handleMessage() {
    if (!token) return;
    try {
      const conv = await api.post<{ id: string }>('/chat/conversations', { targetUserId: userId }, token);
      router.push(`/chat?conv=${conv.id}`);
    } catch {
      router.push('/chat');
    }
  }

  async function handleInvite() {
    if (!token || inviting || inviteSent) return;
    setInviting(true);
    try {
      await api.post('/invite', { receiverId: userId }, token);
      setInviteSent(true);
      toast.success('Invitation sent!');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send invitation';
      toast.error(msg);
    }
    setInviting(false);
  }

  async function handleBlockToggle() {
    if (!token) return;
    try {
      if (isBlocked) {
        await api.delete(`/users/${userId}/block`, token);
        setIsBlocked(false);
        toast.success('User unblocked');
      } else {
        await api.post(`/users/${userId}/block`, undefined, token);
        setIsBlocked(true);
        toast.success('User blocked');
      }
    } catch { toast.error('Failed to update block status'); }
  }

  async function handleSaveToggle() {
    if (!token) return;
    try {
      if (isSaved) {
        await api.delete(`/users/${userId}/save`, token);
        setIsSaved(false);
        toast.success('Profile removed from bookmarks');
      } else {
        await api.post(`/users/${userId}/save`, undefined, token);
        setIsSaved(true);
        toast.success('Profile bookmarked');
      }
    } catch { toast.error('Failed to update bookmark'); }
  }

  async function handleReport() {
    if (!token || !reportReason.trim()) return;
    setReporting(true);
    try {
      await api.post('/reports', { targetType: 'user', targetId: userId, reason: reportReason }, token);
      toast.success('Report submitted. We will review it shortly.');
      setShowReportModal(false);
      setReportReason('');
    } catch { toast.error('Failed to submit report'); }
    setReporting(false);
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-lg font-semibold">{error || 'Profile not found'}</p>
        <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.userId;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Back
      </button>

      <Card>
        <CardContent className="pt-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start sm:gap-6">
            <Avatar src={profile.avatarUrl} name={profile.displayName} size="xl" border />
            <div className="mt-4 sm:mt-0 flex-1">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              {profile.headline && <p className="text-muted-foreground">{profile.headline}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {profile.location && <span className="flex items-center gap-1"><MapPin size={14} />{profile.location}</span>}
                {profile.experienceLevel && <span className="flex items-center gap-1"><Star size={14} />{profile.experienceLevel}</span>}
                <span className="flex items-center gap-1"><Shield size={14} />{profile.reputationScore} pts</span>
                {profile.availability === 'OPEN_TO_COLLABORATE' && (
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">Open to Collaborate</span>
                )}
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
              {!isOwnProfile && (
                <>
                  <Button variant="secondary" size="sm" onClick={handleMessage}>
                    <MessageCircle size={16} className="mr-1" /> Message
                  </Button>
                  <Button size="sm" onClick={handleInvite} disabled={inviting || inviteSent}>
                    <Send size={16} className="mr-1" />
                    {inviteSent ? 'Invited' : inviting ? '...' : 'Invite'}
                  </Button>
                  <Button size="sm" onClick={handleSwipeLike} disabled={swiping}>
                    <ThumbsUp size={16} className="mr-1" /> {swiping ? '...' : 'Connect'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSaveToggle} title={isSaved ? 'Remove bookmark' : 'Bookmark profile'}>
                    {isSaved ? <BookmarkCheck size={16} className="text-primary" /> : <Bookmark size={16} />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleBlockToggle} title={isBlocked ? 'Unblock user' : 'Block user'}>
                    <Ban size={16} className={isBlocked ? 'text-danger' : ''} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowReportModal(true)} title="Report user">
                    <Flag size={16} />
                  </Button>
                </>
              )}
              {isOwnProfile && (
                <Link href="/profile/edit"><Button size="sm">Edit Profile</Button></Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {profile.bio && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">About</h2>
            <p className="text-sm leading-relaxed">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {profile.skills.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s.skill.name} className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium">
                  {s.skill.name}
                  {s.proficiency > 1 && <span className="ml-1 text-xs text-muted-foreground">Lv.{s.proficiency}</span>}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {profile.githubUsername && (
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <ExternalLink size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium">GitHub</p>
                <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                  @{profile.githubUsername}
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {profile.portfolioLinks && profile.portfolioLinks.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Portfolio</h2>
              <div className="space-y-1.5">
                {profile.portfolioLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink size={14} /> {link.label}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-warning" />
              <h2 className="text-lg font-semibold">Report User</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Why are you reporting this profile?</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue…"
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowReportModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleReport} disabled={!reportReason.trim() || reporting}>
                {reporting ? 'Submitting…' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
