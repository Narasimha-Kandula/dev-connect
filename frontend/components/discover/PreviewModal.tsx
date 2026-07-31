'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/lib/avatar';
import { SkillsList } from '@/components/profile-card';
import { X } from 'lucide-react';
import type { DiscoverProfile } from '@/lib/discover-types';

interface PreviewModalProps {
  profile: DiscoverProfile | null;
  onClose: () => void;
}

export function PreviewModal({ profile, onClose }: PreviewModalProps) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <CardContent className="pt-8">
          <button onClick={onClose} className="float-right text-muted-foreground"><X size={18} /></button>
          <div className="flex items-center gap-4">
            <Avatar src={profile.avatarUrl} name={profile.displayName} size="lg" />
            <div>
              <p className="font-semibold">{profile.displayName}</p>
              <p className="text-sm text-muted-foreground">{profile.headline}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            {profile.bio || 'No bio available'}
          </p>
          <div className="mt-4">
            <SkillsList skills={profile.skills ?? []} />
          </div>
          <div className="mt-4 flex gap-4">
            <Link href={`/profile/${profile.userId}`}><Button size="sm">View Full Profile</Button></Link>
            <Link href="/chat"><Button variant="secondary" size="sm">Send Message</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
