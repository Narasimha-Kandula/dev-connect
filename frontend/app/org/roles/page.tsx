'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus, Pencil } from 'lucide-react';

const DEFAULT_ROLES = [
  { name: 'Admin', permissions: ['Full access', 'Manage members', 'Manage billing'] },
  { name: 'Contributor', permissions: ['View projects', 'Edit assigned projects', 'Chat with team'] },
  { name: 'Viewer', permissions: ['View projects', 'View members'] },
];

export default function OrgRolesPage() {
  const [roles] = useState(DEFAULT_ROLES);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><Shield size={20} className="mr-2 inline" /> Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Define access controls for your organization.</p>
        </div>
        <Button size="sm"><Plus size={14} className="mr-1" /> Create Role</Button>
      </div>

      <div className="space-y-4">
        {roles.map((r) => (
          <Card key={r.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{r.name}</p>
                <Button variant="ghost" size="sm"><Pencil size={14} /></Button>
              </div>
              <ul className="mt-3 space-y-1">
                {r.permissions.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {p}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
