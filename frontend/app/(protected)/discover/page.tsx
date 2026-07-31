'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Filter, Eye, EyeOff } from 'lucide-react';
import dynamic from 'next/dynamic';
import { DiscoverSkeleton } from '@/components/skeletons';
import { DetailPanel } from '@/components/detail-panel';
import { SwipeCard } from '@/components/discover/SwipeCard';
import { FilterPanel } from '@/components/discover/FilterPanel';
import { SearchBar } from '@/components/discover/SearchBar';
import { RecentProfilesSection } from '@/components/discover/RecentProfilesSection';
import { SwipeControls } from '@/components/discover/SwipeControls';
import { SwipeBottomSheet } from '@/components/discover/SwipeBottomSheet';
import { PreviewModal } from '@/components/discover/PreviewModal';
import { EmptyState } from '@/components/discover/EmptyState';
import { useDiscover } from '@/hooks/useDiscover';

const MatchModal = dynamic(() => import('@/components/match-modal').then((m) => ({ default: m.MatchModal })), { ssr: false });

export default function DiscoverPage() {
  const token = useAuthStore((s) => s.token);

  // ─── UI-only state (not business logic) ───
  const [showFilters, setShowFilters] = useState(false);
  const [hideMyProfile, setHideMyProfile] = useState(false);

  // ─── All discover business logic ───
  const {
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
  } = useDiscover();

  if (loading) return <DiscoverSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-6 py-10">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">Discover Developers</h1>
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none"
                title="Sort order"
              >
                <option value="best">Best Match</option>
                <option value="newest">Newest</option>
              </select>
              <button
                onClick={async () => {
                  const nextState = !hideMyProfile;
                  setHideMyProfile(nextState);
                  try {
                    await api.patch('/users/me/profile', { preferences: { isPublic: !nextState } }, token ?? undefined);
                  } catch { setHideMyProfile(!nextState); }
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

          {/* Filters */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onApply={handleApplyFilters}
              token={token}
            />
          )}

          {/* Search */}
          <SearchBar token={token} />

          {/* Recently Joined */}
          <RecentProfilesSection profiles={recentProfiles} />

          {/* Swipe Card Area */}
          {!current && !loadingMore && profiles.length === 0 ? (
            <EmptyState onRefresh={handleRefresh} />
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
                    />
                  )}
                  {current && (
                    <SwipeCard
                      key={current.id}
                      profile={current}
                      onSwipe={handleSwipe}
                      isTop
                      exitDirection={exitDirection}
                      onPreview={handlePreview}
                    />
                  )}
                </AnimatePresence>
              </div>
              <div className="hidden md:block">
                <SwipeControls
                  onSwipe={handleSwipe}
                  onUndo={handleUndo}
                  undoAvailable={undoAvailable}
                  loadingMore={loadingMore}
                />
              </div>
              <SwipeBottomSheet
                visible={!!current}
                onSwipe={handleSwipe}
                onUndo={handleUndo}
                undoAvailable={undoAvailable}
                loadingMore={loadingMore}
                index={index}
                total={profiles.length}
              />
            </>
          ) : null}

          {/* Preview Modal (mobile) */}
          <PreviewModal profile={showPreview} onClose={() => setShowPreview(null)} />

          {/* Detail Panel (desktop sidebar) */}
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
            onSwipe={(d) => { setDetailUser(null); handleSwipe(d); }}
          />

          {/* Match Modal */}
          <MatchModal
            open={matchModalState !== null}
            partnerName={matchModalState?.partnerName ?? ''}
            partnerId={matchModalState?.partnerId ?? ''}
            matchScore={matchModalState?.matchScore}
            onClose={dismissMatchModal}
          />
        </div>
      </div>
    </motion.div>
  );
}
