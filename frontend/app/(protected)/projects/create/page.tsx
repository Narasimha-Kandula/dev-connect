'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, type ProjectInput } from '@/lib/validations';

export default function CreateProjectPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
  });

  async function onSubmit(data: ProjectInput) {
    setLoading(true);
    setError(null);
    try {
      await api.post('/projects', {
        title: data.title,
        description: data.description,
        requiredSkills: data.skills?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
      }, token ?? undefined);
      router.push('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <button onClick={() => router.back()} className="mb-4 inline-flex min-h-[44px] items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        &larr; Back
      </button>
      <Card>
        <CardHeader>
          <CardTitle>Create a Project</CardTitle>
          <p className="text-sm text-muted-foreground">Describe your project and the collaborators you need.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium">Project Title</label>
              <input {...register('title')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea rows={4} {...register('description')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Required Skills</label>
              <input {...register('skills')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="React, Node.js, PostgreSQL" />
              <p className="mt-1 text-xs text-muted-foreground">Comma-separated list.</p>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">{loading ? 'Creating…' : 'Create Project'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
