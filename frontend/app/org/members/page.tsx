'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { UserPlus, Shield, UserMinus } from 'lucide-react';

interface Member {
  id: string;
  displayName: string;
  role: string;
}

export default function OrgMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ members: Member[] }>('/org/members', token)
      .then((d) => setMembers(d.members ?? []))
      .catch(() => {});
  }, [token]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><Shield size={20} className="mr-2 inline" /> Team Members</h1>
          <p className="text-sm text-muted-foreground">Manage your organization members.</p>
        </div>
        <Button size="sm"><UserPlus size={14} className="mr-1" /> Add Member</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-primary">
                  {m.displayName?.charAt(0) ?? '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{m.displayName}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm"><UserMinus size={14} /></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
