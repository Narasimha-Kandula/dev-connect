'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Activity as ActivityIcon, MessageCircle, UserPlus, ThumbsUp, Folder } from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  detail?: string;
  createdAt: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;
    api.get<{ activities: ActivityItem[] }>('/activity', token)
      .then((d) => setActivities(d.activities ?? []))
      .catch(() => {});
  }, [token]);

  const actionIcons: Record<string, typeof ActivityIcon> = {
    match: UserPlus, message: MessageCircle, swipe: ThumbsUp, project: Folder,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><ActivityIcon size={20} className="mr-2 inline" /> Activity</h1>
      <p className="text-sm text-muted-foreground">Your recent actions and network updates.</p>

      {activities.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No activity yet. Start exploring to build your history.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {activities.map((a) => {
          const Icon = actionIcons[a.action] ?? ActivityIcon;
          return (
            <Card key={a.id}>
              <CardContent className="flex items-start gap-4 pt-6">
                <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="text-sm">{a.detail ?? a.action}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
