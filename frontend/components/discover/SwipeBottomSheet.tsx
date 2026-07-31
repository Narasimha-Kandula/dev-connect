'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ThumbsUp, Star, Undo2, RefreshCw } from 'lucide-react';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface SwipeBottomSheetProps {
  visible: boolean;
  onSwipe: (direction: 'left' | 'right' | 'super') => void;
  onUndo: () => void;
  undoAvailable: boolean;
  loadingMore: boolean;
  index: number;
  total: number;
}

export function SwipeBottomSheet({
  visible,
  onSwipe,
  onUndo,
  undoAvailable,
  loadingMore,
  index,
  total,
}: SwipeBottomSheetProps) {
  const isMobile = useBreakpoint('mobile');

  // On desktop, don't render the bottom sheet at all
  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40"
        >
          <div          className="rounded-t-2xl border border-border border-b-0 bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] px-4 pb-8 pt-3">
            {/* Drag handle */}
            <div className="mb-4 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Progress counter */}
            <div className="mb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span className="font-medium">
                {index + 1} of {total}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => onSwipe('left')}
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-card text-muted-foreground shadow-sm transition-all active:scale-90 active:bg-danger/5 active:border-danger/30"
                title="Pass"
                aria-label="Pass"
              >
                <X size={24} />
              </button>

              <button
                onClick={() => onSwipe('right')}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all active:scale-90 active:brightness-110"
                title="Like"
                aria-label="Like"
              >
                <ThumbsUp size={24} />
              </button>

              <button
                onClick={() => onSwipe('super')}
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-sm transition-all active:scale-90 active:bg-primary/5"
                title="Super Like"
                aria-label="Super Like"
              >
                <Star size={24} className="fill-primary" />
              </button>
            </div>

            {/* Undo + Loading row */}
            <div className="mt-4 flex items-center justify-center gap-3">
              {undoAvailable && (
                <Button variant="ghost" size="sm" onClick={onUndo} className="gap-1.5 text-xs">
                  <Undo2 size={14} /> Undo
                </Button>
              )}
              {loadingMore && (
                <RefreshCw className="animate-spin text-muted-foreground" size={16} />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
