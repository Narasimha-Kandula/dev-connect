'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Search as SearchIcon, SlidersHorizontal, User, Folder } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'developers' | 'projects'>('developers');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !token) return;
    setSearched(true);
    try {
      const data = await api.get<{ results: any[] }>(`/search?q=${encodeURIComponent(query)}&type=${type}`, token);
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><SearchIcon size={20} className="mr-2 inline" /> Search</h1>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search developers, skills, projects…"
            className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex gap-2">
        <button onClick={() => setType('developers')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${type === 'developers' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <User size={14} /> Developers
        </button>
        <button onClick={() => setType('projects')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${type === 'projects' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <Folder size={14} /> Projects
        </button>
      </div>

      {searched && results.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No results found for &quot;{query}&quot;.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="pt-6">
              <Link href={r.displayName ? `/profile/${r.id}` : `/projects/${r.id}`} className="flex items-center gap-3">
                {'displayName' in r ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-primary">
                      {r.displayName?.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{r.displayName}</p>
                      <p className="text-xs text-muted-foreground">{r.headline ?? 'Developer'}</p>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                  </div>
                )}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
