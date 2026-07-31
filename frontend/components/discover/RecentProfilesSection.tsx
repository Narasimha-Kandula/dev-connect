'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { SkillsList } from '@/components/profile-card';
import type { DiscoverProfile } from '@/lib/discover-types';

interface RecentProfilesSectionProps {
  profiles: DiscoverProfile[];
}

export function RecentProfilesSection({ profiles }: RecentProfilesSectionProps) {
  if (profiles.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Users size={16} /> Recently Joined
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {profiles.map((p) => (
          <Link key={p.id} href={`/profile/${p.userId}`} className="shrink-0">
            <div className="w-40 rounded-2xl bg-white dark:bg-card shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md p-4 text-center">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-base font-bold text-primary shadow-sm">
                {p.displayName?.charAt(0) ?? '?'}
              </div>
              <div className="mt-2">
                <p className="text-sm font-semibold leading-tight truncate">{p.displayName}</p>
                <p className="text-[11px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">{p.headline ?? 'Developer'}</p>
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                <SkillsList skills={p.skills} max={2} size="xs" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
