import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

interface ProjectDetail {
  title: string;
  description?: string;
  status: string;
  requiredSkills?: string[];
  owner: { profile?: { displayName: string } };
  members: { user: { profile?: { displayName: string } }; role: string }[];
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await api.get<ProjectDetail>(`/projects/${id}`);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Card>
        <CardContent className="pt-6">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{project.status}</span>
          <h1 className="mt-3 text-2xl font-bold">{project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">by {project.owner.profile?.displayName}</p>
          <p className="mt-4 text-sm">{project.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {project.requiredSkills?.map((s) => (
              <span key={s} className="rounded-full bg-muted px-3 py-1 text-xs">{s}</span>
            ))}
          </div>

          <h2 className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">Team</h2>
          <div className="space-y-1 text-sm">
            {project.members.map((m, i) => (
              <p key={i}>{m.user.profile?.displayName} — <span className="text-muted-foreground">{m.role}</span></p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
