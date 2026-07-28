'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Bell, MessageCircle, UserPlus, Folder, Info, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const token = useAuthStore((s) => s.token);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;
    api.get<Notification[]>('/notifications', token)
      .then((d) => setNotifications(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);

  const icons: Record<string, typeof Bell> = {
    MATCH: UserPlus, MESSAGE: MessageCircle, INVITATION: UserPlus, PROJECT: Folder, SYSTEM: Info,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight"><Bell size={20} className="mr-2 inline" /> Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on matches, messages, and activity.</p>
        </div>
      </div>

      {notifications.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No notifications yet. Activity will appear here as you match and chat.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = icons[n.type] ?? Bell;
          return (
            <Card key={n.id} className={n.isRead ? '' : 'border-primary/30 bg-primary/5'}>
              <CardContent className="flex items-start gap-4 pt-6">
                <Icon size={18} className="mt-0.5 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {n.isRead && <CheckCheck size={14} className="mt-1 shrink-0 text-muted-foreground" />}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
