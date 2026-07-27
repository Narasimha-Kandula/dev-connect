import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

interface ProfileData {
  displayName: string;
  headline?: string;
  bio?: string;
  location?: string;
  availability: string;
  skills: { skill: { name: string } }[];
}

export default async function ProfilePage() {
  let profile: ProfileData | null = null;
  try {
    profile = await api.get<ProfileData>('/users/me/profile');
  } catch {
    profile = null;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold text-primary">
              {profile?.displayName?.[0] ?? 'D'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile?.displayName ?? 'Your Profile'}</h1>
              <p className="text-muted-foreground">{profile?.headline ?? 'Add a headline to stand out'}</p>
            </div>
          </div>

          {profile?.bio && <p className="mb-4 text-sm">{profile.bio}</p>}

          <div className="flex flex-wrap gap-2">
            {profile?.skills?.map((s) => (
              <span key={s.skill.name} className="rounded-full bg-muted px-3 py-1 text-xs">
                {s.skill.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
