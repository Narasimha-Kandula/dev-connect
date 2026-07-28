'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ArrowRight, Check, User, Wrench, Compass } from 'lucide-react';

const STEPS = [
  {
    icon: User,
    title: 'Complete Your Profile',
    desc: 'Add your name, headline, and bio so developers know who you are.',
    fields: ['displayName', 'headline', 'bio'] as const,
  },
  {
    icon: Wrench,
    title: 'Select Your Skills',
    desc: 'Add the technologies you work with to get relevant matches.',
    fields: ['techStack'] as const,
  },
  {
    icon: Compass,
    title: 'Set Preferences',
    desc: 'Tell us what you are looking for — collaboration, hiring, or mentorship.',
    fields: ['preferences'] as const,
  },
];

const SKILLS = ['React', 'Node.js', 'Python', 'TypeScript', 'Go', 'Rust', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ displayName: '', headline: '', bio: '', techStack: [] as string[], preferences: '' });
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  function toggleSkill(skill: string) {
    setForm((f) => ({
      ...f,
      techStack: f.techStack.includes(skill) ? f.techStack.filter((s) => s !== skill) : [...f.techStack, skill],
    }));
  }

  async function handleFinish() {
    setLoading(true);
    try {
      await api.patch('/users/me/profile', {
        displayName: form.displayName || undefined,
        headline: form.headline || undefined,
        bio: form.bio || undefined,
      }, token);
      await api.put('/users/me/skills', { skills: form.techStack.map((name) => ({ name })) }, token);
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center px-6">
      <Card className="w-full">
        <CardHeader>
          <div className="mb-4 flex gap-2">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <CardTitle>{STEPS[step].title}</CardTitle>
          <p className="text-sm text-muted-foreground">{STEPS[step].desc}</p>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Display Name</label>
                <input value={form.displayName} onChange={(e) => setForm(f => ({ ...f, displayName: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Headline</label>
                <input value={form.headline} onChange={(e) => setForm(f => ({ ...f, headline: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Full-stack developer" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Bio</label>
                <textarea rows={3} value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s) => (
                <button key={s} onClick={() => toggleSkill(s)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    form.techStack.includes(s) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}>
                  {form.techStack.includes(s) && <Check size={12} className="mr-1 inline" />}
                  {s}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {['Looking to collaborate on projects', 'Open to hiring / being hired', 'Seeking mentorship', 'Exploring the platform'].map((opt) => (
                <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm transition-colors ${form.preferences === opt ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}>
                  <input type="radio" name="pref" value={opt} checked={form.preferences === opt} onChange={(e) => setForm(f => ({ ...f, preferences: e.target.value }))} className="sr-only" />
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${form.preferences === opt ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                    {form.preferences === opt && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  {opt}
                </label>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>Back</Button>
            ) : <div />}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}><ArrowRight size={14} className="mr-1" /> Next</Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading}>{loading ? 'Setting up…' : 'Go to Dashboard'}</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
