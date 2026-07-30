'use client';

import { useEffect } from 'react';

export function useMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — DevConnect` : 'DevConnect — Find Your Next Tech Co-Founder';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (description && metaDesc) metaDesc.setAttribute('content', description);
  }, [title, description]);
}
