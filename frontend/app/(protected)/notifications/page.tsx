'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import Link from 'next/link';
import { Bell, MessageCircle, UserPlus, Folder, Info, CheckCheck, ExternalLink } from 'lucide-react';
import { NotificationsSkeleton } from '@/components/skeletons';

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  metadata?: { sourceUserId?: string; invitationId?: string; matchId?: string };
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const token = useAuthStore((s) => s.token);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { resetUnreadCount } = useNotificationSocket();

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get<Notification[]>('/notifications', token)
      .then((d) => setNotifications(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.patch('/notifications/read-all', {}, token).catch(() => {});
    resetUnreadCount();
  }, [token, resetUnreadCount]);

  if (loading) return <NotificationsSkeleton />;

  const icons: Record<string, typeof Bell> = {
    MATCH: UserPlus, MESSAGE: MessageCircle, INVITATION: UserPlus, PROJECT: Folder, SYSTEM: Info,
  };

  const notificationHref = (n: Notification): string | null => {
    if (n.type === 'INVITATION' && n.metadata?.sourceUserId) return `/profile/${n.metadata.sourceUserId}`;
    if (n.type === 'MATCH' && n.metadata?.matchId) return `/matches`;
    return null;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell size={20} className="text-primary" /> Notifications
        </h1>
        <p className="text-sm text-muted-foreground">Stay updated on matches, messages, and activity.</p>
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
          const href = notificationHref(n);
          const card = (
            <Card key={n.id} className={n.isRead ? '' : 'border-primary/30 bg-primary/[0.03]'}>
              <CardContent className="flex items-start gap-4 pt-6">
                <Icon size={18} className="mt-0.5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                  {n.isRead && <CheckCheck size={14} className="text-muted-foreground" />}
                  {href && <ExternalLink size={14} className="text-muted-foreground" />}
                </div>
              </CardContent>
            </Card>
          );
          return href ? (
            <Link key={n.id} href={href} className="block">
              {card}
            </Link>
          ) : (
            <div key={n.id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
