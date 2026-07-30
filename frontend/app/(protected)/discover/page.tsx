'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ThumbsUp, X, Filter, RefreshCw, Star, Users, Search, Eye, EyeOff, Globe, Briefcase, XCircle, Undo2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { DiscoverSkeleton } from '@/components/skeletons';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ProfileCard, SkillsList } from '@/components/profile-card';
import { DetailPanel } from '@/components/detail-panel';
import { ExpandableBio } from '@/components/ExpandableBio';
import { Avatar } from '@/lib/avatar';

const MatchModal = dynamic(() => import('@/components/match-modal').then((m) => ({ default: m.MatchModal })), { ssr: false });

interface AutocompleteResult {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
}

interface DiscoverProfile {
  id: string;
  userId: string;
  displayName: string;
  headline: string;
  bio?: string;
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
        <div className="h-full w-full rounded-2xl border-0 bg-white dark:bg-card shadow-lg ring-1 ring-black/5">
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
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-white dark:bg-card shadow-lg ring-1 ring-black/5">
        <CardContent className="flex h-full flex-col justify-between py-8 px-6">
          <div>
            <div className="flex items-center gap-4">
              <Avatar src={profile.avatarUrl} name={profile.displayName} size="lg" className="shrink-0 shadow-sm" />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold truncate">{profile.displayName}</p>
                <p className="text-sm text-muted-foreground truncate">{profile.headline ?? 'Software Developer'}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-primary">{profile.reputationScore}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">pts</p>
              </div>
            </div>
            <div className="mt-5">
              <SkillsList skills={profile.skills ?? []} max={6} />
            </div>
            <ExpandableBio text={profile.bio ?? null} className="mt-3" />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {profile.location}
              </span>
            )}
            {profile.experienceLevel && (
              <span className="capitalize">{profile.experienceLevel}</span>
            )}
            <span>{profile.reputationScore > 0 ? `${profile.reputationScore} pts` : 'New'}</span>
          </div>
        </CardContent>

        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{ opacity: likeOpacity }}
        >
          <span className="rotate-[-15deg] text-6xl font-black text-green-500 border-4 border-green-500 rounded-xl px-4 py-1 uppercase tracking-wider">
            Like
          </span>
        </motion.div>
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl"
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [recentProfiles, setRecentProfiles] = useState<DiscoverProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState<DiscoverProfile | null>(null);
  const [detailUser, setDetailUser] = useState<DiscoverProfile | null>(null);
  const [filters, setFilters] = useState({
    skills: searchParams.get('skills')?.split(',').filter(Boolean) ?? [] as string[],
    location: searchParams.get('location') ?? '',
    experience: searchParams.get('experience') ?? '',
    remote: searchParams.get('remote') === 'true',
    available: searchParams.get('available') === 'true',
  });
  const [skillSearch, setSkillSearch] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'best');
  const [exitDirection, setExitDirection] = useState<string>('right');
  const [matchModal, setMatchModal] = useState<{ partnerName: string; partnerId: string; matchScore?: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AutocompleteResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [hideMyProfile, setHideMyProfile] = useState(false);
  const [undoAvailable, setUndoAvailable] = useState<{ targetId: string } | null>(null);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const skillTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const token = useAuthStore((s) => s.token);

  async function loadProfiles(loadMore = false) {
    if (!loadMore) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (filters.skills.length) params.set('skill', filters.skills.join(','));
      if (filters.location) params.set('location', filters.location);
      if (filters.experience) params.set('experienceLevel', filters.experience);
      if (filters.remote) params.set('remote', 'true');
      if (filters.available) params.set('available', 'true');
      if (sort === 'newest') params.set('sort', 'newest');
      params.set('hideSelf', 'true');
      if (loadMore) params.set('offset', String(profiles.length));
      const qs = params.toString();
      const data = await api.get<DiscoverProfile[]>(`/discover${qs ? `?${qs}` : ''}`, token ?? undefined);
      const list = Array.isArray(data) ? data : [];
      if (loadMore) {
        setProfiles((prev) => [...prev, ...list]);
      } else {
        setProfiles(list);
        setIndex(0);
      }
    } catch {
      if (!loadMore) setProfiles([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function syncFiltersToUrl(f: typeof filters) {
    const params = new URLSearchParams();
    if (f.skills.length) params.set('skills', f.skills.join(','));
    if (f.location) params.set('location', f.location);
    if (f.experience) params.set('experience', f.experience);
    if (f.remote) params.set('remote', 'true');
    if (f.available) params.set('available', 'true');
    if (sort !== 'best') params.set('sort', sort);
    const qs = params.toString();
    router.replace(`/discover${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  const handleSkillSearch = useCallback((query: string) => {
    setSkillSearch(query);
    if (skillTimeout.current) clearTimeout(skillTimeout.current);
    if (query.length < 1) { setSkillSuggestions([]); return; }
    skillTimeout.current = setTimeout(async () => {
      try {
        const data = await api.get<{ id: string; name: string }[]>(`/skills?search=${encodeURIComponent(query)}`, token ?? undefined);
        setSkillSuggestions(Array.isArray(data) ? data : []);
      } catch { setSkillSuggestions([]); }
    }, 200);
  }, [token]);

  const addSkill = useCallback((name: string) => {
    setFilters((prev) => {
      if (prev.skills.includes(name)) return prev;
      const next = { ...prev, skills: [...prev.skills, name] };
      syncFiltersToUrl(next);
      return next;
    });
    setSkillSearch('');
    setSkillSuggestions([]);
  }, []);

  const removeSkill = useCallback((name: string) => {
    setFilters((prev) => {
      const next = { ...prev, skills: prev.skills.filter((s) => s !== name) };
      syncFiltersToUrl(next);
      return next;
    });
  }, []);

  const updateFilter = useCallback(<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      syncFiltersToUrl(next);
      return next;
    });
  }, []);

  useEffect(() => {
    loadProfiles();
    api.get<DiscoverProfile[]>('/discover?sort=newest&limit=5', token ?? undefined)
      .then((d) => setRecentProfiles(Array.isArray(d) ? d : []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setHighlightIndex(-1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const raw = await api.get<AutocompleteResult[]>(`/search/autocomplete?q=${encodeURIComponent(query)}&limit=8`, token ?? undefined);
        const items = Array.isArray(raw) ? raw : [];
        setSearchResults(items);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 250);
  }, [token]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!searchResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      const selected = searchResults[highlightIndex];
      if (selected) window.location.href = `/profile/${selected.userId}`;
    } else if (e.key === 'Escape') {
      setSearchResults([]);
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  }, [searchResults, highlightIndex]);

  async function swipe(action: 'right' | 'left' | 'super') {
    if (index >= profiles.length) {
      if (!loadingMore) loadProfiles(true);
      return;
    }
    const target = profiles[index];
    setExitDirection(action === 'right' ? 'right' : action === 'left' ? 'left' : 'super');
    const targetId = target.userId ?? target.id;
    try {
      const result = await api.post<{ matched: boolean; match?: { matchScore?: number } }>('/discover/swipe', {
        targetId,
        action: action === 'right' ? 'LIKE' : action === 'super' ? 'SUPER_LIKE' : 'PASS',
      }, token ?? undefined);
      if (result.matched) {
        setMatchModal({ partnerName: target.displayName, partnerId: targetId, matchScore: result.match?.matchScore });
      }
    } catch {
      toast.error('Swipe failed, please try again');
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    if (nextIndex >= profiles.length - 2 && !loadingMore) {
      loadProfiles(true);
    }
    setUndoAvailable({ targetId });
    if (undoTimer) clearTimeout(undoTimer);
    setUndoTimer(setTimeout(() => setUndoAvailable(null), 5000));
  }

  async function handleUndo() {
    if (!undoAvailable || !token) return;
    try {
      await api.post('/discover/undo', undefined, token);
      setUndoAvailable(null);
      if (undoTimer) clearTimeout(undoTimer);
      const prevIndex = Math.max(0, index - 1);
      setIndex(prevIndex);
    } catch {}
  }

  const current = profiles[index];
  const next = profiles[index + 1];

  if (loading) {
    return <DiscoverSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-background">
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Discover Developers</h1>
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); syncFiltersToUrl(filters); }}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none"
          >
            <option value="best">Best Match</option>
            <option value="newest">Newest</option>
          </select>
          <button
            onClick={async () => {
              const next = !hideMyProfile;
              setHideMyProfile(next);
              try {
                await api.patch('/users/me/profile', { preferences: { isPublic: !next } }, token ?? undefined);
              } catch { setHideMyProfile(!next); }
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              hideMyProfile ? 'bg-danger/10 text-danger' : 'text-muted-foreground hover:text-foreground'
            }`}
            title={hideMyProfile ? 'Your profile is hidden' : 'Your profile is visible'}
          >
            {hideMyProfile ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="hidden sm:inline">{hideMyProfile ? 'Hidden' : 'Visible'}</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} className="mr-1" /> Filters
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardContent className="space-y-3 pt-6">
            <div className="flex flex-wrap gap-1.5 items-center">
              {(filters.skills ?? []).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-destructive"><XCircle size={14} /></button>
                </span>
              ))}
              <div className="relative">
                <input
                  placeholder="Add skill…"
                  value={skillSearch}
                  onChange={(e) => handleSkillSearch(e.target.value)}
                  className="min-w-[120px] rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                {skillSuggestions.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-card shadow-xl max-h-40 overflow-y-auto">
                    {skillSuggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => addSkill(s.name)}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted/30 transition-colors"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <input placeholder="Location" value={filters.location} onChange={(e) => updateFilter('location', e.target.value)} className="flex-1 min-w-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <select value={filters.experience} onChange={(e) => updateFilter('experience', e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                <option value="">Any level</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={filters.remote} onChange={(e) => updateFilter('remote', e.target.checked)} className="rounded border-input" />
                <Globe size={14} className="text-muted-foreground" /> Remote only
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={filters.available} onChange={(e) => updateFilter('available', e.target.checked)} className="rounded border-input" />
                <Briefcase size={14} className="text-muted-foreground" /> Available for hire
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => loadProfiles()}>Apply Filters</Button>
              <Button size="sm" variant="ghost" onClick={() => {
                const cleared = { skills: [], location: '', experience: '', remote: false, available: false };
                setFilters(cleared);
                setSkillSearch('');
                setSkillSuggestions([]);
                syncFiltersToUrl(cleared);
                loadProfiles();
              }}>Clear All</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search developers by name, skill, or keyword…"
          className="w-full rounded-xl border border-input bg-background pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
        />
        {searching && (
          <RefreshCw size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
        )}
        {searchQuery.length >= 2 && !searching && searchResults.length > 0 && (
          <div className="absolute z-30 mt-2 w-full rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 max-h-80 overflow-y-auto">
            {searchResults.map((p, i) => (
              <div key={p.id} className={`border-b border-border/50 last:border-0 ${i === highlightIndex ? 'bg-muted/50' : ''}`}>
                <ProfileCard user={{ id: p.id, displayName: p.displayName, headline: p.headline, avatarUrl: p.avatarUrl }} href={`/profile/${p.userId}`} size="sm" showSkills={false} />
              </div>
            ))}
          </div>
        )}
        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
          <div className="absolute z-30 mt-2 w-full rounded-xl border border-border bg-card shadow-xl p-4 text-center text-sm text-muted-foreground">
            No developers found
          </div>
        )}
      </div>

      {recentProfiles.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Users size={16} /> Recently Joined
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {recentProfiles.map((p) => (
              <Link
                key={p.id}
                href={`/profile/${p.userId}`}
                className="shrink-0"
              >
                <div className="w-40 rounded-2xl bg-white dark:bg-card shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md p-4 text-center">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-base font-bold text-primary shadow-sm">
                    {p.displayName?.charAt(0) ?? '?'}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-semibold leading-tight truncate">{p.displayName}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">{p.headline ?? 'Developer'}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    <SkillsList skills={p.skills} max={2} size="xs" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!current && !loadingMore && profiles.length === 0 ? (
        <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-semibold">You&apos;ve seen everyone.</p>
          <p className="mt-1 text-sm text-muted-foreground">Adjust filters or check back later.</p>
          <Button className="mt-6" onClick={() => loadProfiles()}><RefreshCw size={16} className="mr-2" /> Refresh</Button>
        </div>
      ) : current ? (
        <>
          <div className="relative mx-auto h-[460px] w-full max-w-sm">
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
                  onPreview={(p) => {
                    if (window.innerWidth >= 1024) setDetailUser(p);
                    else setShowPreview(p);
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <Button variant="secondary" onClick={() => swipe('left')} className="h-14 w-14 rounded-full p-0"><X size={22} /></Button>
            <Button onClick={() => swipe('right')} className="h-14 w-14 rounded-full p-0"><ThumbsUp size={22} /></Button>
            <Button variant="secondary" onClick={() => swipe('super')} className="h-14 w-14 rounded-full border-2 border-primary p-0"><Star size={22} className="text-primary" /></Button>
          </div>
          {undoAvailable && (
            <div className="mt-3 flex justify-center">
              <Button variant="ghost" size="sm" onClick={handleUndo} className="text-xs gap-1">
                <Undo2 size={14} /> Undo
              </Button>
            </div>
          )}

          {loadingMore && (
            <div className="mt-4 flex justify-center">
              <RefreshCw className="animate-spin text-muted-foreground" size={18} />
            </div>
          )}
        </>
      ) : null}

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPreview(null)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardContent className="pt-8">
              <button onClick={() => setShowPreview(null)} className="float-right text-muted-foreground"><X size={18} /></button>
              <div className="flex items-center gap-4">
                <Avatar src={showPreview.avatarUrl} name={showPreview.displayName} size="lg" />
                <div>
                  <p className="font-semibold">{showPreview.displayName}</p>
                  <p className="text-sm text-muted-foreground">{showPreview.headline}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {showPreview.bio || 'No bio available'}
              </p>
              <div className="mt-4">
                <SkillsList skills={showPreview.skills ?? []} />
              </div>
              <div className="mt-4 flex gap-4">
                <Link href={`/profile/${showPreview.userId}`}><Button size="sm">View Full Profile</Button></Link>
                <Link href={`/chat`}><Button variant="secondary" size="sm">Send Message</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DetailPanel
        user={detailUser ? {
          userId: detailUser.userId,
          displayName: detailUser.displayName,
          headline: detailUser.headline,
          bio: detailUser.bio,
          avatarUrl: detailUser.avatarUrl,
          location: detailUser.location,
          experienceLevel: detailUser.experienceLevel,
          reputationScore: detailUser.reputationScore,
          skills: detailUser.skills,
        } : null}
        onClose={() => setDetailUser(null)}
        onSwipe={(d) => { setDetailUser(null); swipe(d); }}
      />

      <MatchModal
        open={matchModal !== null}
        partnerName={matchModal?.partnerName ?? ''}
        partnerId={matchModal?.partnerId ?? ''}
        matchScore={matchModal?.matchScore}
        onClose={() => setMatchModal(null)}
      />
    </div>
    </div>
  );
}
