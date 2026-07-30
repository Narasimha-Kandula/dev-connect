'use client';

import { useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export interface AutocompleteSuggestion {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  avatarUrl: string | null;
}

export function useAutocomplete() {
  const token = useAuthStore((s) => s.token);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      setHighlightIndex(-1);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (q.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      timeoutRef.current = setTimeout(async () => {
        try {
          const data = await api.get<AutocompleteSuggestion[]>(
            `/search/autocomplete?q=${encodeURIComponent(q)}&limit=8`,
            token ?? undefined,
          );
          setSuggestions(Array.isArray(data) ? data : []);
        } catch {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [token],
  );

  const clear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setHighlightIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, onSelect: (s: AutocompleteSuggestion) => void) => {
      if (!suggestions.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Enter' && highlightIndex >= 0) {
        e.preventDefault();
        onSelect(suggestions[highlightIndex]);
        clear();
      } else if (e.key === 'Escape') {
        clear();
      }
    },
    [suggestions, highlightIndex, clear],
  );

  return { query, suggestions, loading, highlightIndex, search, clear, handleKeyDown, setQuery };
}
