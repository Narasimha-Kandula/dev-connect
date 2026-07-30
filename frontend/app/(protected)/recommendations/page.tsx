'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Sparkles, ArrowLeft, Users, Briefcase, Star, ChevronRight } from 'lucide-react';
import { Avatar } from '@/lib/avatar';
import { SkillsList } from '@/components/profile-card';
import { toast } from 'sonner';

interface AiInsights {
  profileStrength: number;
  topSkills: string[];
  recommendedSkills: string[];
  suggestedRoles: string[];
  matchSuggestions: Array<{
    id: string;
    userId: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
    skills: { name: string; proficiency: number }[];
    matchReason: string;
  }>;
}

interface RecommendedProject {
  id: string;
  title: string;
  description: string | null;
  status: string;
  requiredSkills: string[];
  owner: { id: string; profile: { displayName: string; avatarUrl: string | null } | null };
}

export default function RecommendationsPage() {
  const token = useAuthStore((s) => s.token);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [projects, setProjects] = useState<RecommendedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const timeout = setTimeout(() => {
      if (loading) {
        toast.error('Recommendations are taking longer than expected. Showing partial results.');
        setLoading(false);
      }
    }, 10000);
    Promise.allSettled([
      api.get<AiInsights>('/recommendations/ai-insights', token).catch(() => null),
      api.get<RecommendedProject[]>('/recommendations/projects', token).catch(() => []),
    ]).then(([insightsResult, projectsResult]) => {
      if (insightsResult.status === 'fulfilled') setInsights(insightsResult.value);
      if (projectsResult.status === 'fulfilled') {
        setProjects(Array.isArray(projectsResult.value) ? projectsResult.value : []);
      }
    }).catch(() => {})
      .finally(() => { clearTimeout(timeout); setLoading(false); });
  }, [token]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <Sparkles size={22} className="text-primary" /> AI Recommendations
      </h1>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {insights && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Profile Strength</p>
                  <p className="mt-1 text-3xl font-bold text-primary">{insights.profileStrength}%</p>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium mb-2">Your Top Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.topSkills.map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{s}</span>
                    ))}
                  </div>
                  {insights.recommendedSkills.length > 0 && (
                    <>
                      <p className="text-sm font-medium mt-3 mb-2">Recommended Skills to Add</p>
                      <div className="flex flex-wrap gap-1.5">
                        {insights.recommendedSkills.map((s) => (
                          <span key={s} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{s}</span>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {insights && insights.suggestedRoles.length > 0 && (
            <Card>
              <CardHeader><CardTitle><Star size={16} className="mr-1 inline" /> Suggested Roles</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {insights.suggestedRoles.map((role) => (
                    <span key={role} className="rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">{role}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {insights && insights.matchSuggestions.length > 0 && (
            <Card>
              <CardHeader><CardTitle><Users size={16} className="mr-1 inline" /> Recommended Matches</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {insights.matchSuggestions.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <Avatar src={m.avatarUrl} name={m.displayName} size="md" />
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${m.userId}`} className="text-sm font-semibold hover:text-primary transition-colors">
                        {m.displayName}
                      </Link>
                      {m.headline && <p className="text-xs text-muted-foreground truncate">{m.headline}</p>}
                      <SkillsList skills={m.skills ?? []} max={3} size="xs" />
                      {m.matchReason && <p className="mt-1 text-xs text-muted-foreground italic">{m.matchReason}</p>}
                    </div>
                    <Link href={`/profile/${m.userId}`}>
                      <ChevronRight size={18} className="text-muted-foreground" />
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {projects.length > 0 && (
            <Card>
              <CardHeader><CardTitle><Briefcase size={16} className="mr-1 inline" /> Projects Matching Your Skills</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {projects.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/projects/${p.id}`} className="text-sm font-semibold hover:text-primary transition-colors">
                        {p.title}
                      </Link>
                      {p.description && <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>}
                      {p.requiredSkills && p.requiredSkills.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(Array.isArray(p.requiredSkills) ? p.requiredSkills : []).map((s: string) => (
                            <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link href={`/projects/${p.id}`}>
                      <ChevronRight size={18} className="text-muted-foreground" />
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(!insights || (insights.matchSuggestions.length === 0 && projects.length === 0)) && (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles size={40} className="mx-auto text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No personalized recommendations yet.</p>
                <p className="text-xs text-muted-foreground">Complete your profile and add skills to get AI-powered suggestions.</p>
                <div className="mt-4 flex justify-center gap-3">
                  <Link href="/profile/edit"><Button variant="secondary" size="sm">Complete Profile</Button></Link>
                  <Link href="/discover"><Button size="sm">Discover Developers</Button></Link>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
