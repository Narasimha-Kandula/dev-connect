'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ExternalLink, Plus, Image, FileText } from 'lucide-react';
import Link from 'next/link';

export default function PortfolioPage() {
  const [projects, setProjects] = useState<{ id: string; title: string; description: string }[]>([]);
  const [tab, setTab] = useState<'projects' | 'media'>('projects');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ projects: typeof projects }>('/projects?mine=true', token)
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <Link href="/projects/create"><Button size="sm"><Plus size={14} className="mr-1" /> Add Project</Button></Link>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('projects')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === 'projects' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <FileText size={14} /> Featured Projects
        </button>
        <button onClick={() => setTab('media')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === 'media' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <Image size={14} /> Media
        </button>
      </div>

      {tab === 'projects' && (
        <>
          {projects.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No projects in your portfolio yet. Create or showcase your best work.
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold">{p.title}</p>
                    <Link href={`/projects/${p.id}`}><ExternalLink size={14} className="text-muted-foreground" /></Link>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'media' && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No media uploaded yet. Add images or videos to showcase your work.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
