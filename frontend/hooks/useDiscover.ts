'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import {
  loadProfiles,
  loadRecentProfiles,
  performSwipe,
  performUndo,
  parseFiltersFromSearchParams,
  filtersToUrl,
} from '@/lib/discover-utils';
import type { DiscoverProfile, DiscoverFilters, MatchModalState } from '@/lib/discover-types';

export interface DiscoverAPI {
  // Profiles
  profiles: DiscoverProfile[];
  recentProfiles: DiscoverProfile[];
  index: number;
  current: DiscoverProfile | undefined;
  next: DiscoverProfile | undefined;

  // Loading
  loading: boolean;
  loadingMore: boolean;

  // Filters & sort
  filters: DiscoverFilters;
  sort: string;
  setFilters: React.Dispatch<React.SetStateAction<DiscoverFilters>>;
  setSort: React.Dispatch<React.SetStateAction<string>>;

  // Animation
  exitDirection: string;

  // Match modal
  matchModalState: MatchModalState | null;
  dismissMatchModal: () => void;

  // Undo
  undoAvailable: boolean;

  // Preview / detail
  showPreview: DiscoverProfile | null;
  setShowPreview: React.Dispatch<React.SetStateAction<DiscoverProfile | null>>;
  detailUser: DiscoverProfile | null;
  setDetailUser: React.Dispatch<React.SetStateAction<DiscoverProfile | null>>;
  handlePreview: (p: DiscoverProfile) => void;

  // Actions
  handleSwipe: (action: 'left' | 'right' | 'super') => Promise<void>;
  handleUndo: () => Promise<void>;
  handleApplyFilters: () => Promise<void>;
  handleRefresh: () => Promise<void>;
}

export function useDiscover(): DiscoverAPI {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAuthStore((s) => s.token);

  // ─── Core state ───
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [recentProfiles, setRecentProfiles] = useState<DiscoverProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>(parseFiltersFromSearchParams(searchParams));
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'best');
  const [exitDirection, setExitDirection] = useState('right');
  const [matchModalState, setMatchModalState] = useState<MatchModalState | null>(null);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [showPreview, setShowPreview] = useState<DiscoverProfile | null>(null);
  const [detailUser, setDetailUser] = useState<DiscoverProfile | null>(null);

  const undoTimer = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // ─── Derived ───
  const current = profiles[index];
  const next = profiles[index + 1];

  // ─── Initial fetch ───
  useEffect(() => {
    const init = async () => {
      try {
        const [list, recent] = await Promise.all([
          loadProfiles(filters, sort, token),
          loadRecentProfiles(token),
        ]);
        setProfiles(list);
        setRecentProfiles(recent);
      } catch {
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    };
    init();
    // Only run once on mount — filters/sort are captured at mount time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sync filters + sort to URL (skip initial mount) ───
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = filtersToUrl(filters, sort);
    const qs = params.toString();
    router.replace(`/discover${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [filters, sort, router]);

  // ─── Apply filters ───
  const handleApplyFilters = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadProfiles(filters, sort, token);
      setProfiles(list);
      setIndex(0);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, token]);

  // ─── Refresh (reset everything) ───
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadProfiles(filters, sort, token);
      setProfiles(list);
      setIndex(0);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, token]);

  // ─── Load more profiles (pagination) ───
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const more = await loadProfiles(filters, sort, token, profiles.length);
      setProfiles((prev) => [...prev, ...more]);
    } catch {
      // Silently fail on pre-fetch
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, filters, sort, token, profiles.length]);

  // ─── Swipe handler ───
  const handleSwipe = useCallback(async (action: 'left' | 'right' | 'super') => {
    // If we've run out of profiles, try loading more
    if (index >= profiles.length) {
      await loadMore();
      return;
    }

    const target = profiles[index];
    setExitDirection(action === 'right' ? 'right' : action === 'left' ? 'left' : 'super');

    try {
      const result = await performSwipe(
        target.userId ?? target.id,
        action === 'super' ? 'SUPER_LIKE' : action === 'right' ? 'LIKE' : 'PASS',
        token,
      );
      if (result.matched) {
        setMatchModalState({
          partnerName: target.displayName,
          partnerId: target.userId ?? target.id,
          matchScore: result.match?.matchScore,
        });
      }
    } catch {
      toast.error('Swipe failed, please try again');
      return;
    }

    // Advance index
    const nextIndex = index + 1;
    setIndex(nextIndex);

    // Pre-fetch more profiles when running low
    if (nextIndex >= profiles.length - 2) {
      loadMore();
    }

    // Enable undo for 5 seconds
    setUndoAvailable(true);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoAvailable(false), 5000);
  }, [index, profiles, token, loadMore]);

  // ─── Undo handler ───
  const handleUndo = useCallback(async () => {
    if (!undoAvailable || !token) return;
    try {
      await performUndo(token);
      setUndoAvailable(false);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      setIndex((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, [undoAvailable, token]);

  // ─── Dismiss match modal ───
  const dismissMatchModal = useCallback(() => setMatchModalState(null), []);

  // ─── Preview handler (mobile modal vs desktop sidebar) ───
  const handlePreview = useCallback((p: DiscoverProfile) => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setDetailUser(p);
    } else {
      setShowPreview(p);
    }
  }, []);

  return {
    profiles,
    recentProfiles,
    index,
    current,
    next,
    loading,
    loadingMore,
    filters,
    sort,
    setFilters,
    setSort,
    exitDirection,
    matchModalState,
    dismissMatchModal,
    undoAvailable,
    showPreview,
    setShowPreview,
    detailUser,
    setDetailUser,
    handlePreview,
    handleSwipe,
    handleUndo,
    handleApplyFilters,
    handleRefresh,
  };
}
