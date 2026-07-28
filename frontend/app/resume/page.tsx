'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, History, Sparkles } from 'lucide-react';

export default function ResumePage() {
  const [hasResume, setHasResume] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><FileText size={20} className="mr-2 inline" /> Resume</h1>
          <p className="text-sm text-muted-foreground">Upload, generate, and manage your CV.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => {}}>
          <CardContent className="pt-6 text-center">
            <Upload size={24} className="mx-auto mb-2 text-primary" />
            <p className="font-semibold text-sm">Upload Resume</p>
            <p className="text-xs text-muted-foreground">PDF, DOC, or TXT</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="pt-6 text-center">
            <Sparkles size={24} className="mx-auto mb-2 text-accent" />
            <p className="font-semibold text-sm">AI Resume Builder</p>
            <p className="text-xs text-muted-foreground">Generate from profile</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardContent className="pt-6 text-center">
            <History size={24} className="mx-auto mb-2 text-success" />
            <p className="font-semibold text-sm">Version History</p>
            <p className="text-xs text-muted-foreground">View past versions</p>
          </CardContent>
        </Card>
      </div>

      {!hasResume && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No resume uploaded yet. Upload one or use the AI builder.
          </CardContent>
        </Card>
      )}

      {hasResume && (
        <Card>
          <CardHeader><CardTitle>Current Resume</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-primary" />
              <div>
                <p className="text-sm font-medium">resume_v3.pdf</p>
                <p className="text-xs text-muted-foreground">Uploaded Jan 15, 2026</p>
              </div>
            </div>
            <Button variant="secondary" size="sm"><Download size={14} className="mr-1" /> Download</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
