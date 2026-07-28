'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Plus, Award, BadgeCheck } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  proficiency: number;
  isVerified: boolean;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ skills: Skill[] }>('/skills', token)
      .then((d) => setSkills(d.skills ?? []))
      .catch(() => {});
  }, [token]);

  async function handleAdd() {
    if (!newSkill.trim() || !token) return;
    try {
      const created = await api.post<Skill>('/skills', { name: newSkill.trim(), proficiency: 3 }, token);
      setSkills((prev) => [...prev, created]);
      setNewSkill('');
    } catch {}
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><Award size={20} className="mr-2 inline" /> Skills</h1>
          <p className="text-sm text-muted-foreground">Manage your skill set and proficiency levels.</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex gap-3 pt-6">
          <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill…"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
          <Button onClick={handleAdd}><Plus size={14} className="mr-1" /> Add</Button>
        </CardContent>
      </Card>

      {skills.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No skills added yet. Add technologies you work with.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {skills.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-primary">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{s.name}</p>
                    {s.isVerified && <BadgeCheck size={14} className="text-primary" />}
                  </div>
                  <div className="mt-1 flex gap-0.5">{Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className={`h-2 w-6 rounded-full ${i < s.proficiency ? 'bg-primary' : 'bg-muted'}`} />
                  ))}</div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{s.proficiency}/5</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
