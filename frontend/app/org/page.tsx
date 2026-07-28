'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Building2, Users, Folder, Settings } from 'lucide-react';

export default function OrgPage() {
  const [org, setOrg] = useState<{ name: string; memberCount: number; projectCount: number } | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ org: typeof org }>('/org', token)
      .then((d) => setOrg(d.org)).catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><Building2 size={20} className="mr-2 inline" /> {org?.name ?? 'Organization'}</h1>
          <p className="text-sm text-muted-foreground">Your team workspace hub.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users size={24} className="mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{org?.memberCount ?? 0}</p>
            <p className="text-sm text-muted-foreground">Team Members</p>
            <Link href="/org/members"><Button variant="secondary" size="sm" className="mt-3">View Members</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Folder size={24} className="mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">{org?.projectCount ?? 0}</p>
            <p className="text-sm text-muted-foreground">Active Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Settings size={24} className="mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">{org?.memberCount ?? 0}</p>
            <p className="text-sm text-muted-foreground">Roles Defined</p>
            <Link href="/org/roles"><Button variant="secondary" size="sm" className="mt-3">Manage Roles</Button></Link>
          </CardContent>
        </Card>
      </div>

      <Link href="/org/hiring"><Button variant="secondary">Hiring Pipeline</Button></Link>
    </div>
  );
}
