'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { UserPlus, Clock, Check, X, Eye } from 'lucide-react';
import Link from 'next/link';

interface Candidate {
  id: string;
  displayName: string;
  stage: string;
  appliedDate: string;
}

export default function HiringPipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stage, setStage] = useState('all');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ candidates: Candidate[] }>(`/org/hiring${stage !== 'all' ? `?stage=${stage}` : ''}`, token)
      .then((d) => setCandidates(d.candidates ?? []))
      .catch(() => {});
  }, [token, stage]);

  const stages = ['all', 'applied', 'screened', 'interviewed', 'offered', 'hired'];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><UserPlus size={20} className="mr-2 inline" /> Hiring Pipeline</h1>
          <p className="text-sm text-muted-foreground">Track candidates through your hiring process.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {stages.map((s) => (
          <button key={s} onClick={() => setStage(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${stage === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {s}
          </button>
        ))}
      </div>

      {candidates.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No candidates in the pipeline yet.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {candidates.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-primary">
                  {c.displayName?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{c.displayName}</p>
                  <p className="text-xs text-muted-foreground">Applied {new Date(c.appliedDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">{c.stage}</span>
                <Link href={`/profile/${c.id}`}><Button variant="ghost" size="sm"><Eye size={14} /></Button></Link>
                <Button variant="ghost" size="sm"><Check size={14} className="text-success" /></Button>
                <Button variant="ghost" size="sm"><X size={14} className="text-danger" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
