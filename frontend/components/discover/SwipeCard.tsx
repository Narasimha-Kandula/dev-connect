'use client';

import { motion, useMotionValue, useTransform } from 'framer-motion';
import { CardContent } from '@/components/ui/card';
import { Avatar } from '@/lib/avatar';
import { SkillsList } from '@/components/profile-card';
import { ExpandableBio } from '@/components/ExpandableBio';
import type { DiscoverProfile } from '@/lib/discover-types';

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

interface SwipeCardProps {
  profile: DiscoverProfile;
  onSwipe: (direction: 'left' | 'right' | 'super') => void;
  isTop: boolean;
  exitDirection: string;
  onPreview?: (p: DiscoverProfile) => void;
}

export function SwipeCard({ profile, onSwipe, isTop, exitDirection, onPreview }: SwipeCardProps) {
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
      onClick={() => onPreview?.(profile)}
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
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
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
