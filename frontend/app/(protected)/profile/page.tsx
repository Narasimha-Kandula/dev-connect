'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Pencil, Github, Linkedin, Globe, Star, MessageCircle } from 'lucide-react';

interface ProfileData {
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  location: string;
  availableForHire: boolean;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  githubUsername?: string;
  experienceLevel?: string;
  reputationScore: number;
  profileCompleteness: number;
  skills: { skill: { id: string; name: string }; proficiency: number }[];
}

export default function ProfilePage() {
  const { token, user: authUser } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get<{ profile: ProfileData } & Record<string, unknown>>('/users/me', token)
      .then((d) => {
        const p = 'profile' in d ? (d as { profile: ProfileData }).profile : (d as unknown as ProfileData);
        setProfile(p as ProfileData);
      })
      .catch(() => {});
  }, [token]);

  if (!profile) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-center text-muted-foreground">Loading profile…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Developer Profile</h1>
        <Link href="/profile/edit"><Button variant="secondary" size="sm"><Pencil size={14} className="mr-1" /> Edit Profile</Button></Link>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 pt-6">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.displayName} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold text-primary">
              {profile.displayName?.charAt(0) ?? '?'}
            </div>
          )}
          <div className="flex-1">
            <p className="text-xl font-semibold">{profile.displayName ?? 'Unnamed Developer'}</p>
            <p className="text-sm text-muted-foreground">{profile.headline ?? 'No headline set'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {profile.location && <span>{profile.location}</span>}
              {profile.experienceLevel && <span>{profile.experienceLevel}</span>}
              <span className="flex items-center gap-1"><Star size={14} className="text-primary" /> {profile.reputationScore} pts</span>
              {profile.availableForHire && (
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Available for hire</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{profile.bio || 'No bio yet — tell the community about yourself.'}</p></CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tech Stack</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.skills?.length ? profile.skills.map((s) => (
              <span key={s.skill.id} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{s.skill.name}</span>
            )) : <span className="text-sm text-muted-foreground">No technologies listed.</span>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Links</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {profile.githubUrl && <a href={profile.githubUrl} target="_blank" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Github size={14} /> GitHub</a>}
            {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Linkedin size={14} /> LinkedIn</a>}
            {profile.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><Globe size={14} /> Portfolio</a>}
            {!profile.githubUrl && !profile.linkedinUrl && !profile.portfolioUrl && <p className="text-sm text-muted-foreground">No links shared.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button><MessageCircle size={14} className="mr-1" /> Message</Button>
        <Link href="/skills"><Button variant="ghost">Skills</Button></Link>
      </div>
    </div>
  );
}
