'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Plus, Bookmark } from 'lucide-react';
import { ProjectsSkeleton } from '@/components/skeletons';

interface Project {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  budget?: string;
  timeline?: string;
}

export default function ProjectsPage() {
  const token = useAuthStore((s) => s.token);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skillFilter, setSkillFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilter(skillFilter), 300);
    return () => clearTimeout(timer);
  }, [skillFilter]);

  useEffect(() => {
    if (!token) return;
    const params = debouncedFilter ? `?skill=${encodeURIComponent(debouncedFilter)}` : '';
    api.get<Project[]>(`/projects${params}`, token)
      .then((d) => setProjects(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, debouncedFilter]);

  if (loading) {
    return <ProjectsSkeleton />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Browse open positions and find your next collaboration.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} placeholder="Filter by skill…" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-40" />
          <Link href="/projects/create" className="w-full sm:w-auto"><Button className="w-full sm:w-auto"><Plus size={16} className="mr-1" /> Create Project</Button></Link>
        </div>
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 sm:py-10">
            No projects yet. Create the first one to attract collaborators.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}>
            <Card className="group h-full transition-shadow hover:shadow-md">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{p.title}</p>
                  <Bookmark size={14} className="mt-1 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {(p.requiredSkills ?? []).map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>
                  ))}
                </div>
                <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                  {p.budget && <span>{p.budget}</span>}
                  {p.timeline && <span>{p.timeline}</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
