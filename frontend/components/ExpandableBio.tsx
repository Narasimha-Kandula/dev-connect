'use client';

import { useState } from 'react';

interface ExpandableBioProps {
  text: string | null;
  maxLines?: number;
  className?: string;
}

export function ExpandableBio({ text, maxLines = 3, className = '' }: ExpandableBioProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return <p className={`text-xs text-muted-foreground italic ${className}`}>No bio available</p>;
  }

  const shouldTruncate = text.length > 120 || text.split('\n').length > maxLines;

  return (
    <div className={className}>
      <p
        className={`text-xs text-muted-foreground leading-relaxed transition-all ${
          !expanded && shouldTruncate ? `line-clamp-${maxLines}` : ''
        }`}
      >
        {text}
      </p>
      {shouldTruncate && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
