'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Bookmark, User, Folder } from 'lucide-react';

export default function SavedPage() {
  const [tab, setTab] = useState<'developers' | 'projects'>('developers');
  const [savedDevelopers, setSavedDevelopers] = useState<{ id: string; displayName: string; headline?: string }[]>([]);
  const [savedProjects, setSavedProjects] = useState<{ id: string; title: string }[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ saved: typeof savedDevelopers }>('/saved/developers', token)
      .then((d) => setSavedDevelopers(d.saved ?? [])).catch(() => {});
    api.get<{ saved: typeof savedProjects }>('/saved/projects', token)
      .then((d) => setSavedProjects(d.saved ?? [])).catch(() => {});
  }, [token]);

  const list = tab === 'developers' ? savedDevelopers : savedProjects;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight"><Bookmark size={20} className="mr-2 inline" /> Saved</h1>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('developers')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === 'developers' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <User size={14} /> Developers
        </button>
        <button onClick={() => setTab('projects')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === 'projects' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <Folder size={14} /> Projects
        </button>
      </div>

      {list.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No saved {tab} yet. Browse and bookmark profiles or projects.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              {'displayName' in item ? (
                <Link href={`/profile/${item.id}`} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-primary">
                    {item.displayName?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.displayName}</p>
                    <p className="text-xs text-muted-foreground">{item.headline ?? 'Developer'}</p>
                  </div>
                </Link>
              ) : (
                <Link href={`/projects/${item.id}`} className="text-sm font-semibold">{item.title}</Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
