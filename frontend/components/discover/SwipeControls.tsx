'use client';

import { Button } from '@/components/ui/button';
import { X, ThumbsUp, Star, Undo2, RefreshCw } from 'lucide-react';

interface SwipeControlsProps {
  onSwipe: (direction: 'left' | 'right' | 'super') => void;
  onUndo: () => void;
  undoAvailable: boolean;
  loadingMore: boolean;
}

export function SwipeControls({ onSwipe, onUndo, undoAvailable, loadingMore }: SwipeControlsProps) {
  return (
    <>
      <div className="mt-6 flex justify-center gap-4">
        <Button variant="secondary" onClick={() => onSwipe('left')} className="h-14 w-14 rounded-full p-0" title="Pass">
          <X size={22} />
        </Button>
        <Button onClick={() => onSwipe('right')} className="h-14 w-14 rounded-full p-0" title="Like">
          <ThumbsUp size={22} />
        </Button>
        <Button variant="secondary" onClick={() => onSwipe('super')} className="h-14 w-14 rounded-full border-2 border-primary p-0" title="Super Like">
          <Star size={22} className="text-primary" />
        </Button>
      </div>
      {undoAvailable && (
        <div className="mt-3 flex justify-center">
          <Button variant="ghost" size="sm" onClick={onUndo} className="text-xs gap-1">
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
  );
}
