'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import Link from 'next/link';
import { ThumbsUp, ThumbsDown, Sparkles, Filter, X, RefreshCw, Star } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

interface DiscoverProfile {
  id: string;
  userId: string;
  displayName: string;
  headline: string;
  avatarUrl: string | null;
  skills: { name: string; proficiency: number }[];
  location?: string;
  experienceLevel?: string;
  reputationScore: number;
}

const cardVariants = {
  initial: { scale: 0.95, y: 20, opacity: 0 },
  animate: { scale: 1, y: 0, opacity: 1 },
  exit: (direction: string) => ({
    x: direction === 'left' ? -500 : direction === 'right' ? 500 : 0,
    y: direction === 'super' ? -600 : 0,
    opacity: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
  }),
};

const nextCardVariants = {
  initial: { scale: 0.95, y: 20, opacity: 0 },
  animate: { scale: 0.95, y: 8, opacity: 1 },
};

function SwipeCard({
  profile,
  onSwipe,
  isTop,
  exitDirection,
  onPreview,
}: {
  profile: DiscoverProfile;
  onSwipe: (direction: 'left' | 'right' | 'super') => void;
  isTop: boolean;
  exitDirection: string;
  onPreview: (p: DiscoverProfile) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  const likeOpacity = useTransform(x, [0, 200], [0, 1]);
  const passOpacity = useTransform(x, [-200, 0], [1, 0]);

  function handleDragEnd(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    const swipeThreshold = 100;
    const velocityThreshold = 500;

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      onSwipe('right');
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      onSwipe('left');
    }
  }

  if (!isTop) {
    return (
      <motion.div
        className="pointer-events-none absolute inset-0"
        variants={nextCardVariants}
        initial="initial"
        animate="animate"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="h-full w-full rounded-2xl border bg-card shadow-lg">
          <CardContent className="flex h-full items-center justify-center pt-8">
            <p className="text-sm text-muted-foreground">{profile.displayName}</p>
          </CardContent>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      custom={exitDirection}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={() => onPreview(profile)}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl border bg-card shadow-lg">
        <CardContent className="flex h-full flex-col pt-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-bold text-primary">
              {profile.displayName?.charAt(0) ?? '?'}
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold">{profile.displayName}</p>
              <p className="text-sm text-muted-foreground">{profile.headline ?? 'Software Developer'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{profile.reputationScore} pts</p>
              <p className="text-xs text-muted-foreground">Reputation</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(profile.skills ?? []).map((s) => (
              <span key={s.name} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{s.name}</span>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            {profile.location && <span>{profile.location}</span>}
            {profile.experienceLevel && <span>{profile.experienceLevel}</span>}
            <span>{profile.reputationScore > 0 ? `${profile.reputationScore} pts` : 'New'}</span>
          </div>
        </CardContent>

        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl"
          style={{ opacity: likeOpacity }}
        >
          <span className="rotate-[-15deg] text-6xl font-black text-green-500 border-4 border-green-500 rounded-xl px-4 py-1 uppercase tracking-wider">
            Like
          </span>
        </motion.div>

        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl"
          style={{ opacity: passOpacity }}
        >
          <span className="rotate-[15deg] text-6xl font-black text-red-500 border-4 border-red-500 rounded-xl px-4 py-1 uppercase tracking-wider">
            Nope
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState<DiscoverProfile | null>(null);
  const [filters, setFilters] = useState({ skill: '', location: '', experience: '' });
  const [exitDirection, setExitDirection] = useState<string>('right');
  const token = useAuthStore((s) => s.token);

  async function loadProfiles() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.skill) params.set('skill', filters.skill);
      if (filters.location) params.set('location', filters.location);
      if (filters.experience) params.set('experienceLevel', filters.experience);
      const qs = params.toString();
      const data = await api.get<DiscoverProfile[]>(`/discover${qs ? `?${qs}` : ''}`, token ?? undefined);
      setProfiles(Array.isArray(data) ? data : []);
      setIndex(0);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfiles(); }, []);

  async function swipe(action: 'right' | 'left' | 'super') {
    if (index >= profiles.length) return;
    setExitDirection(action === 'right' ? 'right' : action === 'left' ? 'left' : 'super');
    try {
      await api.post('/discover/swipe', {
        targetId: profiles[index].userId ?? profiles[index].id,
        action: action === 'right' ? 'LIKE' : action === 'super' ? 'SUPER_LIKE' : 'PASS',
      }, token ?? undefined);
    } catch {}
    setIndex((i) => i + 1);
  }

  const current = profiles[index];
  const next = profiles[index + 1];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold">You&apos;ve seen everyone in your area.</p>
        <p className="mt-1 text-sm text-muted-foreground">Adjust filters or check back later.</p>
        <Button className="mt-6" onClick={loadProfiles}><RefreshCw size={16} className="mr-2" /> Refresh</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Discover Developers</h1>
        <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} className="mr-1" /> Filters
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardContent className="flex flex-wrap gap-3 pt-6">
            <input placeholder="Skill" value={filters.skill} onChange={(e) => setFilters(f => ({ ...f, skill: e.target.value }))} className="flex-1 min-w-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <input placeholder="Location" value={filters.location} onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))} className="flex-1 min-w-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <select value={filters.experience} onChange={(e) => setFilters(f => ({ ...f, experience: e.target.value }))} className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Any level</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
            <Button size="sm" onClick={loadProfiles}>Apply</Button>
          </CardContent>
        </Card>
      )}

      <div className="relative mx-auto h-[420px] w-full max-w-md">
        <AnimatePresence mode="popLayout" custom={exitDirection}>
          {next && (
            <SwipeCard
              key={next.id}
              profile={next}
              onSwipe={() => {}}
              isTop={false}
              exitDirection={exitDirection}
              onPreview={() => {}}
            />
          )}
          {current && (
            <SwipeCard
              key={current.id}
              profile={current}
              onSwipe={swipe}
              isTop
              exitDirection={exitDirection}
              onPreview={setShowPreview}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <Button variant="secondary" onClick={() => swipe('left')} className="h-14 w-14 rounded-full p-0"><X size={22} /></Button>
        <Button onClick={() => swipe('right')} className="h-14 w-14 rounded-full p-0"><ThumbsUp size={22} /></Button>
        <Button variant="secondary" onClick={() => swipe('super')} className="h-14 w-14 rounded-full border-2 border-primary p-0"><Star size={22} className="text-primary" /></Button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPreview(null)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardContent className="pt-8">
              <button onClick={() => setShowPreview(null)} className="float-right text-muted-foreground"><X size={18} /></button>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-bold text-primary">
                  {showPreview.displayName?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="font-semibold">{showPreview.displayName}</p>
                  <p className="text-sm text-muted-foreground">{showPreview.headline}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(showPreview.skills ?? []).map((s) => (
                  <span key={s.name} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{s.name}</span>
                ))}
              </div>
              <div className="mt-4 flex gap-4">
                <Link href={`/profile/${showPreview.userId}`}><Button size="sm">View Full Profile</Button></Link>
                <Button variant="secondary" size="sm">Send Message</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
