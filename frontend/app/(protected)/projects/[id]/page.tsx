'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import {
  ArrowLeft, Users, ListTodo, Milestone, FileText, UserPlus,
  Loader2, Plus, Check, X, Clock, ExternalLink, Calendar,
} from 'lucide-react';

interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; profile?: { displayName?: string; avatarUrl?: string; headline?: string } };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  assigneeId?: string;
  dueDate?: string;
  createdAt: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
}

interface SharedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  sizeBytes?: number;
  createdAt: string;
}

interface ProjectDetail {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  status: string;
  budget?: number;
  timeline?: string;
  owner: { id: string; profile?: { displayName?: string } };
  members: ProjectMember[];
  tasks: Task[];
  milestones: Milestone[];
  files: SharedFile[];
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const isOwner = user?.id === project?.owner?.id;

  useEffect(() => {
    if (!token || !id) return;
    api.get<ProjectDetail>(`/projects/${id}`, token)
      .then((d) => {
        setProject(d);
        const isMember = d.members?.some((m) => m.userId === user?.id);
        if (isMember) setHasApplied(true);
      })
      .catch(() => toast.error('Failed to load project'));
  }, [id, token, user?.id]);

  const handleApply = useCallback(async () => {
    if (!token || !id) return;
    setApplying(true);
    try {
      await api.post(`/projects/${id}/join`, {}, token);
      toast.success('Application submitted!');
      setHasApplied(true);
      setShowApplyModal(false);
    } catch {
      toast.error('Failed to apply');
    } finally {
      setApplying(false);
    }
  }, [id, token]);

  const handleAddMember = useCallback(async () => {
    if (!token || !id || !addMemberEmail.trim()) return;
    setAddingMember(true);
    try {
      const data = await api.get<{ hits: { userId: string }[]; total: number }>(`/users/search?q=${encodeURIComponent(addMemberEmail)}`, token);
      const target = data?.hits?.[0] ?? null;
      if (!target) { toast.error('User not found'); return; }
      await api.post(`/projects/${id}/members`, { targetUserId: target.userId, role: 'CONTRIBUTOR' }, token);
      toast.success('Member added!');
      setShowAddMember(false);
      setAddMemberEmail('');
      const updated = await api.get<ProjectDetail>(`/projects/${id}`, token);
      setProject(updated);
    } catch {
      toast.error('Failed to add member');
    } finally {
      setAddingMember(false);
    }
  }, [id, token, addMemberEmail]);

  if (!project) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Back to Projects
        </Link>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            project.status === 'OPEN' ? 'bg-success/10 text-success' :
            project.status === 'IN_PROGRESS' ? 'bg-primary/10 text-primary' :
            'bg-muted text-muted-foreground'
          }`}>{project.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">{project.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                by {project.owner?.profile?.displayName ?? 'Unknown'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>

              {project.budget && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Budget:</span>
                  <span>${project.budget}</span>
                </div>
              )}
              {project.timeline && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span>{project.timeline}</span>
                </div>
              )}

              {(project.requiredSkills ?? []).length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.map((t) => (
                      <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {!hasApplied && !isOwner && (
                <Button onClick={() => setShowApplyModal(true)}>
                  Apply to Join
                </Button>
              )}
              {hasApplied && (
                <p className="text-sm text-muted-foreground">You are a member of this project.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <ListTodo size={18} className="text-primary shrink-0" />
                <CardTitle className="text-base sm:text-lg">Tasks ({project.tasks?.length ?? 0})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {(!project.tasks || project.tasks.length === 0) ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No tasks yet.</p>
              ) : (
                <div className="space-y-2">
                  {project.tasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 rounded-lg border border-border p-3 sm:p-4">
                      <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        task.status === 'DONE' ? 'bg-success' :
                        task.status === 'IN_PROGRESS' ? 'bg-primary' :
                        'bg-muted-foreground/30'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0 sm:flex-row sm:items-center sm:gap-2">
                        {task.dueDate && <span className="text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</span>}
                        <span className="text-xs text-muted-foreground">{task.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Milestone size={18} className="text-primary shrink-0" />
                <CardTitle className="text-base sm:text-lg">Milestones ({project.milestones?.length ?? 0})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {(!project.milestones || project.milestones.length === 0) ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No milestones yet.</p>
              ) : (
                <div className="space-y-3">
                  {project.milestones.map((m) => (
                    <div key={m.id} className="flex items-start gap-3 rounded-lg border border-border p-3 sm:p-4">
                      <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        m.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {m.status === 'COMPLETED' ? <Check size={14} /> : <Clock size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{m.title}</p>
                        {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                      </div>
                      <div className="shrink-0">
                        <span className="text-xs text-muted-foreground">{new Date(m.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary shrink-0" />
                <CardTitle className="text-base sm:text-lg">Files ({project.files?.length ?? 0})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {(!project.files || project.files.length === 0) ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No files shared yet.</p>
              ) : (
                <div className="space-y-2">
                  {project.files.map((f) => (
                    <a key={f.id} href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-border p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                      <FileText size={16} className="text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.fileName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</p>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-primary shrink-0" />
                <CardTitle className="text-base sm:text-lg">Members ({project.members?.length ?? 0})</CardTitle>
              </div>
              {isOwner && (
                <Button variant="ghost" size="sm" onClick={() => setShowAddMember(!showAddMember)}>
                  <UserPlus size={14} />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              {showAddMember && (
                <div className="flex items-center gap-2">
                  <input
                    value={addMemberEmail}
                    onChange={(e) => setAddMemberEmail(e.target.value)}
                    placeholder="Search by name or email..."
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button size="sm" onClick={handleAddMember} disabled={addingMember || !addMemberEmail.trim()}>
                    {addingMember ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  </Button>
                </div>
              )}
              {(!project.members || project.members.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">No members yet.</p>
              ) : (
                project.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-primary">
                      {m.user?.profile?.displayName?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${m.userId}`} className="text-sm font-medium hover:underline">
                        {m.user?.profile?.displayName ?? 'User'}
                      </Link>
                      <p className="text-xs text-muted-foreground capitalize">{m.role.toLowerCase()}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showApplyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onClick={() => { if (!applying) setShowApplyModal(false); }}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full">
            <Card className="mx-auto w-full max-w-md">
              <CardHeader>
                <CardTitle>Apply to Join</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Send a request to join this project. The owner will review your application.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" disabled={applying} onClick={() => setShowApplyModal(false)}>Cancel</Button>
                  <Button disabled={applying} onClick={handleApply}>
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
