'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Avatar } from '@/lib/avatar';
import { Pencil, Star, MessageCircle, Github, Linkedin, Globe } from 'lucide-react';
import { ProfileSkeleton } from '@/components/skeletons';

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
  const { token } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const fetchProfile = useCallback(() => {
    if (!token) return;
    api.get<{ profile: ProfileData } | ProfileData>('/users/me', token)
      .then((d) => {
        const p = 'profile' in d ? (d as { profile: ProfileData }).profile : (d as ProfileData);
        setProfile(p);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (!profile) {
    return <ProfileSkeleton />;
  }

  const skills = profile.skills ?? [];
  const hasLinks = profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-6 py-8">

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Developer Profile</h1>
        <Link href="/profile/edit" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm">
            <Pencil size={14} className="mr-1.5" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* User Overview Card */}
      <Card>
        <CardContent className="flex items-center gap-5 pt-6 pb-6">
          <Avatar src={profile.avatarUrl} name={profile.displayName} size="xl" border />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground truncate">
              {profile.displayName ?? 'Unnamed Developer'}
            </p>
            <p className="text-sm text-muted-foreground">
              {profile.headline || profile.experienceLevel || 'Developer'}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{profile.location || 'Not set yet'}</span>
              <span className="text-border/50">|</span>
              <span className="flex items-center gap-1">
                <Star size={14} className="text-primary" />
                {profile.reputationScore} pts
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {profile.bio || 'No bio yet — tell the community about yourself.'}
          </p>
        </CardContent>
      </Card>

      {/* Tech Stack + Links grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {skills.length > 0 ? (
              skills.map((s) => (
                <span
                  key={s.skill.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-3 py-1 text-xs font-medium text-foreground"
                >
                  {s.skill.name}
                  <span className="flex gap-0.5" title={`Proficiency: ${s.proficiency}/5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-[10px] ${i < s.proficiency ? 'text-amber-500' : 'text-muted-foreground/30'}`}>★</span>
                    ))}
                  </span>
                </span>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No technologies listed.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Github size={14} /> GitHub
              </a>
            )}
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin size={14} /> LinkedIn
              </a>
            )}
            {profile.portfolioUrl && (
              <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Globe size={14} /> Portfolio
              </a>
            )}
            {!hasLinks && (
              <p className="text-sm text-muted-foreground">No links shared.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action Tabs */}
      <div className="flex items-center gap-3">
        <Link href="/chat">
          <Button className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm">
            <MessageCircle size={15} className="mr-1.5" />
            Messages
          </Button>
        </Link>
        <Link href="/skills">
          <Button variant="ghost" className="text-foreground">
            Skills
          </Button>
        </Link>
      </div>
    </div>
  );
}
