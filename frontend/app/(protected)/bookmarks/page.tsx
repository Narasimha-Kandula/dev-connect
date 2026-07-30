'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Bookmark, BookmarkCheck, ArrowLeft, User } from 'lucide-react';
import { BookmarksSkeleton } from '@/components/skeletons';
import { Avatar } from '@/lib/avatar';
import { SkillsList } from '@/components/profile-card';
import { toast } from 'sonner';

interface SavedProfileEntry {
  id: string;
  savedUserId: string;
  createdAt: string;
  savedUser: {
    id: string;
    profile: {
      displayName: string;
      headline: string | null;
      bio: string | null;
      avatarUrl: string | null;
      location: string | null;
      reputationScore: number;
      skills: { skill: { name: string }; proficiency: number }[];
    } | null;
  };
}

export default function BookmarksPage() {
  const token = useAuthStore((s) => s.token);
  const [saved, setSaved] = useState<SavedProfileEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.get<SavedProfileEntry[]>('/users/me/saved', token)
      .then((data) => setSaved(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load bookmarks'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleRemove(savedUserId: string) {
    if (!token) return;
    try {
      await api.delete(`/users/${savedUserId}/save`, token);
      setSaved((prev) => prev.filter((s) => s.savedUserId !== savedUserId));
      toast.success('Removed from bookmarks');
    } catch { toast.error('Failed to remove'); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <Link href="/discover" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Discover
      </Link>
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Bookmark size={20} /> Saved Profiles
      </h1>

      {loading ? (
        <BookmarksSkeleton />
      ) : saved.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookmarkCheck size={40} className="mx-auto text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">No saved profiles yet.</p>
            <p className="text-xs text-muted-foreground">Bookmark profiles you find interesting to revisit them later.</p>
            <Link href="/discover"><Button variant="secondary" size="sm" className="mt-4">Discover Developers</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {saved.map((entry) => {
            const p = entry.savedUser.profile;
            if (!p) return null;
            return (
              <Card key={entry.id}>
                <CardContent className="flex items-center gap-4 pt-6">
                  <Avatar src={p.avatarUrl} name={p.displayName} size="lg" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${entry.savedUserId}`} className="font-semibold hover:text-primary transition-colors">
                      {p.displayName}
                    </Link>
                    {p.headline && <p className="text-sm text-muted-foreground truncate">{p.headline}</p>}
                    <div className="mt-1">
                      <SkillsList skills={(p.skills ?? []).map((s: any) => ({ name: s.skill?.name ?? s.name, proficiency: s.proficiency }))} max={3} size="xs" />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(entry.savedUserId)} title="Remove bookmark">
                    <BookmarkCheck size={16} className="text-primary" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
