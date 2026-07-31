'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { ProfileCard } from '@/components/profile-card';
import { api } from '@/lib/api';
import type { AutocompleteResult } from '@/lib/discover-types';

interface SearchBarProps {
  token: string | null;
}

export function SearchBar({ token }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AutocompleteResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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

  return (
    <div className="relative mb-6">
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={searchInputRef}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        onKeyDown={handleKeyDown}
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
              <ProfileCard
                user={{ id: p.id, displayName: p.displayName, headline: p.headline, avatarUrl: p.avatarUrl }}
                href={`/profile/${p.userId}`}
                size="sm"
                showSkills={false}
              />
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
  );
}
