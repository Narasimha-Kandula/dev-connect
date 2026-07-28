'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { FileText, Image, Download, Upload, Filter } from 'lucide-react';

interface SharedFile {
  id: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  createdAt: string;
  project?: { title: string };
}

export default function FilesPage() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ files: SharedFile[] }>(`/files${typeFilter !== 'all' ? `?type=${typeFilter}` : ''}`, token)
      .then((d) => setFiles(d.files ?? []))
      .catch(() => {});
  }, [token, typeFilter]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight"><FileText size={20} className="mr-2 inline" /> Shared Files</h1>
        <Button size="sm"><Upload size={14} className="mr-1" /> Upload File</Button>
      </div>

      <div className="flex gap-2">
        {['all', 'image', 'document', 'code', 'other'].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {files.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No files shared yet. Upload files from chat or project pages.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((f) => (
          <Card key={f.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.fileType?.startsWith('image') ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                  {f.fileType?.startsWith('image') ? <Image size={18} /> : <FileText size={18} />}
                </div>
                <button className="text-muted-foreground hover:text-foreground"><Download size={14} /></button>
              </div>
              <p className="mt-2 text-sm font-semibold truncate">{f.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {f.sizeBytes ? `${(f.sizeBytes / 1024).toFixed(1)} KB` : 'Unknown size'}
              </p>
              {f.project && <p className="mt-1 text-xs text-muted-foreground">Project: {f.project.title}</p>}
              <p className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
