'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Save, Camera, X, Plus } from 'lucide-react';
import { avatarSrc, Avatar } from '@/lib/avatar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { profileSchema, type ProfileInput } from '@/lib/validations';
import { toast } from 'sonner';

export default function EditProfilePage() {
  const router = useRouter();
  const { token, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarInitial, setAvatarInitial] = useState('');
  const [skillEntries, setSkillEntries] = useState<{ name: string; proficiency: number }[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<{ id: string; name: string }[]>([]);
  const skillTimeout = useRef<NodeJS.Timeout | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      headline: '',
      bio: '',
      location: '',
      skillsStr: '',
    },
  });

  useEffect(() => {
    if (!token) return;
    setLoadError(null);
    api.get<{
      profile?: {
        displayName?: string; headline?: string; bio?: string; location?: string;
        skills?: { skill: { name: string } }[];
        avatarUrl?: string;
      };
    }>('/users/me', token)
      .then((d) => {
        const p = d.profile;
        const loadedSkills = (p?.skills ?? []).map((s: any) => ({ name: s.skill.name, proficiency: s.proficiency ?? 3 }));
        setSkillEntries(loadedSkills);
        reset({
          displayName: p?.displayName ?? '',
          headline: p?.headline ?? '',
          bio: p?.bio ?? '',
          location: p?.location ?? '',
          skillsStr: loadedSkills.map((s: any) => s.name).join(', '),
        });
        const name = p?.displayName ?? (d as Record<string, unknown>).name as string ?? '';
        setAvatarInitial(name.charAt(0).toUpperCase() || '?');
        if (p?.avatarUrl) setAvatarPreview(avatarSrc(p.avatarUrl));
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load profile');
      })
      .finally(() => setFetching(false));
  }, [token, reset]);

  const handleSkillSearch = (query: string) => {
    setNewSkill(query);
    if (skillTimeout.current) clearTimeout(skillTimeout.current);
    if (query.length < 1) { setSkillSuggestions([]); return; }
    skillTimeout.current = setTimeout(async () => {
      try {
        const data = await api.get<{ id: string; name: string }[]>(`/skills?search=${encodeURIComponent(query)}`, token ?? undefined);
        setSkillSuggestions(Array.isArray(data) ? data : []);
      } catch { setSkillSuggestions([]); }
    }, 200);
  };

  const addSkill = (name: string) => {
    if (name && !skillEntries.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      const next = [...skillEntries, { name, proficiency: 3 }];
      setSkillEntries(next);
      setValue('skillsStr', next.map((s) => s.name).join(', '));
    }
    setNewSkill('');
    setSkillSuggestions([]);
  };

  async function onSubmit(data: ProfileInput) {
    setSaving(true);
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const authToken = token ?? '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/users/me/avatar`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: fd,
        });
        if (!res.ok) throw new Error('Avatar upload failed');
      }

      await api.patch('/users/me/profile', {
        displayName: data.displayName || undefined,
        headline: data.headline || undefined,
        bio: data.bio || undefined,
        location: data.location || undefined,
      }, token ?? undefined);

      const skillNames = data.skillsStr?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
      const finalSkills = skillNames.map((name) => {
        const existing = skillEntries.find((e) => e.name.toLowerCase() === name.toLowerCase());
        return { name, proficiency: existing?.proficiency ?? 3 };
      });
      if (finalSkills.length > 0) {
        await api.put('/users/me/skills', { skills: finalSkills }, token ?? undefined);
      }

      const updated = await api.get<Record<string, unknown>>('/users/me', token ?? undefined);
      setUser(updated as never);
      toast.success('Profile saved successfully.');
      setTimeout(() => router.push('/profile'), 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (fetching) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading profile…
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-danger">{loadError}</p>
            <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        &larr; Back to Profile
      </button>
      <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-primary overflow-hidden">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  avatarInitial
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={24} className="text-white" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="sr-only"
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Change Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="displayName" className="mb-1 block text-sm font-medium">Display Name</label>
                <input id="displayName" autoComplete="name" {...register('displayName')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
                {errors.displayName && <p className="mt-1 text-xs text-danger" role="alert">{errors.displayName.message}</p>}
              </div>
              <div>
                <label htmlFor="location" className="mb-1 block text-sm font-medium">Location</label>
                <input id="location" autoComplete="country-name" {...register('location')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="San Francisco, CA" />
                {errors.location && <p className="mt-1 text-xs text-danger" role="alert">{errors.location.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="headline" className="mb-1 block text-sm font-medium">Headline</label>
              <input id="headline" autoComplete="organization-title" {...register('headline')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Full-stack engineer" />
              {errors.headline && <p className="mt-1 text-xs text-danger" role="alert">{errors.headline.message}</p>}
            </div>
            <div>
              <label htmlFor="bio" className="mb-1 block text-sm font-medium">Bio</label>
              <textarea id="bio" rows={4} {...register('bio')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              {errors.bio && <p className="mt-1 text-xs text-danger" role="alert">{errors.bio.message}</p>}
            </div>
            <hr className="border-border" />
            <CardTitle className="text-base">Skills</CardTitle>
            <div className="space-y-2">
              <label htmlFor="skill-input" className="mb-1 block text-sm font-medium">Tech Stack</label>
              <div className="flex flex-wrap gap-2">
                {skillEntries.map((s, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-full bg-muted/70 pl-3 pr-1.5 py-1">
                    <span className="text-xs font-medium">{s.name}</span>
                    <select
                      value={s.proficiency}
                      onChange={(e) => {
                        const next = [...skillEntries];
                        next[i] = { ...next[i], proficiency: Number(e.target.value) };
                        setSkillEntries(next);
                      }}
                      className="ml-1 rounded border-0 bg-transparent text-[10px] font-medium outline-none cursor-pointer"
                      title="Proficiency"
                    >
                      {[1, 2, 3, 4, 5].map((v) => (
                        <option key={v} value={v}>{'★'.repeat(v)}{'☆'.repeat(5 - v)}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const next = skillEntries.filter((_, j) => j !== i);
                        setSkillEntries(next);
                        setValue('skillsStr', next.map((s) => s.name).join(', '));
                      }}
                      className="p-0.5 rounded-full hover:bg-muted transition-colors ml-0.5"
                    >
                      <X size={12} className="text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="skill-input"
                    value={newSkill}
                    onChange={(e) => handleSkillSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(newSkill.trim());
                      }
                      if (e.key === 'Escape') {
                        setSkillSuggestions([]);
                      }
                    }}
                    placeholder="Add a skill and press Enter…"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  {skillSuggestions.length > 0 && (
                    <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-card shadow-xl max-h-40 overflow-y-auto">
                      {skillSuggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => addSkill(s.name)}
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted/30 transition-colors"
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!newSkill.trim()}
                  onClick={() => addSkill(newSkill.trim())}
                >
                  <Plus size={14} />
                </Button>
              </div>
              <input type="hidden" {...register('skillsStr')} />
              <p className="mt-1 text-xs text-muted-foreground">Add skills individually or type comma-separated names above.</p>
              {errors.skillsStr && <p className="mt-1 text-xs text-danger" role="alert">{errors.skillsStr.message}</p>}
            </div>
            <Button type="submit" disabled={saving}>
              <Save size={14} className="mr-1" />
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
