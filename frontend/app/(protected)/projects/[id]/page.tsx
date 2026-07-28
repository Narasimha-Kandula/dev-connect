'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  lookingFor: string[];
  owner: { displayName: string };
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token || !id) return;
    api.get<{ project: ProjectDetail }>(`/projects/${id}`, token)
      .then((d) => setProject(d.project))
      .catch(() => {});
  }, [id, token]);

  useEffect(() => {
    if (!token || !id) return;
    api.get<{ applications: Array<{ id: string }> }>(`/projects/${id}/applications`, token)
      .then((d) => { if (d.applications && d.applications.length > 0) setHasApplied(true); })
      .catch(() => {});
  }, [id, token]);

  const handleApply = useCallback(async () => {
    if (!token || !id) return;
    setApplying(true);
    try {
      await api.post(`/projects/${id}/applications`, { message: applyMessage }, token);
      toast.success('Application submitted!');
      setHasApplied(true);
      setShowApplyModal(false);
      setApplyMessage('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply');
    } finally {
      setApplying(false);
    }
  }, [id, token, applyMessage]);

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-center text-muted-foreground">
        Loading project…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <p className="text-sm text-muted-foreground">by {project.owner?.displayName ?? 'Unknown'}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Tech Stack</p>
            <div className="flex flex-wrap gap-2">
              {(project.techStack ?? []).map((t) => (
                <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{t}</span>
              ))}
            </div>
          </div>

          {(project.lookingFor ?? []).length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium">Looking For</p>
              <div className="flex flex-wrap gap-2">
                {project.lookingFor.map((r) => (
                  <span key={r} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">{r}</span>
                ))}
              </div>
            </div>
          )}

          <Button
            disabled={hasApplied}
            onClick={() => setShowApplyModal(true)}
          >
            {hasApplied ? 'Applied ✓' : 'Apply to Join'}
          </Button>
        </CardContent>
      </Card>

      {showApplyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => { if (!applying) setShowApplyModal(false); }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Apply to Join</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Why do you want to join?</label>
                  <textarea
                    rows={4}
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    placeholder="Tell the project owner why you'd be a great fit..."
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    disabled={applying}
                    onClick={() => { setShowApplyModal(false); setApplyMessage(''); }}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={applying || !applyMessage.trim()}
                    onClick={handleApply}
                  >
                    {applying ? 'Submitting…' : 'Submit Application'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
