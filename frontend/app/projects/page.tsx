import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface ProjectRow {
  id: string;
  title: string;
  description?: string;
  status: string;
  requiredSkills?: string[];
}

export default async function ProjectsPage() {
  let projects: ProjectRow[] = [];
  try {
    projects = await api.get<ProjectRow[]>('/projects');
  } catch {
    projects = [];
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/projects/create"><Button>Post a Project</Button></Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-muted-foreground">No open projects yet — be the first to post one.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full hover:border-primary">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.requiredSkills?.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">{s}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
