'use client';

import { useRef } from 'react';
import { Search, RefreshCw, X } from 'lucide-react';
import { Avatar } from '@/lib/avatar';
import { useAutocomplete, AutocompleteSuggestion } from '@/hooks/useAutocomplete';
import { useRouter } from 'next/navigation';

export function SearchBar() {
  const router = useRouter();
  const { query, suggestions, loading, highlightIndex, search, clear, handleKeyDown } = useAutocomplete();
  const inputRef = useRef<HTMLInputElement>(null);

  function onSelect(s: AutocompleteSuggestion) {
    router.push(`/profile/${s.userId}`);
    clear();
  }

  return (
    <div className="relative w-full max-w-md">
      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => search(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, onSelect)}
        placeholder="Search developers, skills, projects…"
        className="w-full rounded-xl border border-input bg-background pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
      />
      {query && (
        <button onClick={clear} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <X size={16} />}
        </button>
      )}
      {suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 ${
                i === highlightIndex ? 'bg-muted/50' : ''
              }`}
            >
              <Avatar src={s.avatarUrl} name={s.displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{s.displayName}</p>
                {s.headline && <p className="text-xs text-muted-foreground truncate">{s.headline}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && !loading && suggestions.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-xl p-4 text-center text-sm text-muted-foreground">
          No developers found
        </div>
      )}
    </div>
  );
}
