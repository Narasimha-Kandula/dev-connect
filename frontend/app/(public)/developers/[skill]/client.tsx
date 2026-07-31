'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, MapPin, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar } from '@/lib/avatar';
import { SkillsList } from '@/components/profile-card';

interface Developer {
  id: string;
  userId: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  skills: { name: string; proficiency: number }[];
  reputationScore: number;
}

interface DeveloperListingProps {
  skill: string;
}

export function DeveloperListing({ skill }: DeveloperListingProps) {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchDevelopers() {
      try {
        const data = await api.get<Developer[]>(
          `/discover?skill=${encodeURIComponent(skill)}&limit=12&hideSelf=false`,
        );
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setDevelopers(list);
        setCount(list.length);
      } catch {
        if (mounted) {
          setDevelopers([]);
          setCount(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDevelopers();
    return () => { mounted = false; };
  }, [skill]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            <Users size={18} className="inline mr-2" />
            {skill} Developers
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted/30" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-muted/30" />
                  <div className="h-2.5 w-32 rounded bg-muted/20" />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="h-2 w-full rounded bg-muted/20" />
                <div className="h-2 w-3/4 rounded bg-muted/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (developers.length === 0) {
    return (
      <div className="text-center py-16">
        <Users size={48} className="mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold">No {skill} Developers Yet</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Be the first {skill} developer on DevConnect! Create your profile and start collaborating.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Join as a {skill} Developer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          <Users size={18} className="inline mr-2" />
          {count} {skill} Developer{count === 1 ? '' : 's'}
        </h2>
        {count > 0 && (
          <Link
            href={`/discover?skills=${encodeURIComponent(skill)}`}
            className="text-sm text-primary hover:underline"
          >
            View all →
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {developers.map((dev) => (
          <Link
            key={dev.id}
            href={`/profile/${dev.userId}`}
            className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30"
          >
            <div className="flex items-start gap-3">
              <Avatar src={dev.avatarUrl} name={dev.displayName} size="md" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold group-hover:text-primary transition-colors">
                  {dev.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {dev.headline || 'Developer'}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {dev.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={10} />
                      {dev.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star size={10} className="text-amber-500" />
                    {dev.reputationScore}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <SkillsList skills={dev.skills ?? []} max={4} size="xs" />
            </div>
            {dev.bio && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {dev.bio}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
