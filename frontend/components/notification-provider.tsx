'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Bell, UserPlus, MessageCircle, Folder, Info } from 'lucide-react';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { useAuthStore } from '@/stores/auth-store';

const TYPE_ICONS: Record<string, typeof Bell> = {
  MATCH: UserPlus,
  MESSAGE: MessageCircle,
  INVITATION: UserPlus,
  PROJECT: Folder,
  SYSTEM: Info,
};

function playSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

function requestDesktopPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

function showDesktopNotification(title: string, body?: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    try {
      new Notification(`DevConnect: ${title}`, {
        body: body ?? '',
        icon: '/favicon.ico',
      });
    } catch {}
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const { lastNotification, clearLastNotification, unreadCount } = useNotificationSocket();
  const prevCount = useRef(0);
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    requestDesktopPermission();
  }, []);

  useEffect(() => {
    if (document.title.includes('(')) {
      document.title = document.title.replace(/\(\d+\)\s*/, '');
    }
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${document.title.replace(/^\(\d+\)\s*/, '')}`;
    }
  }, [unreadCount]);

  useEffect(() => {
    if (!lastNotification || handledRef.current === lastNotification.id) return;
    handledRef.current = lastNotification.id;

    const Icon = TYPE_ICONS[lastNotification.type] ?? Bell;
    const meta = lastNotification.metadata as { sourceUserId?: string } | undefined;
    const href = lastNotification.type === 'INVITATION' && meta?.sourceUserId
      ? `/profile/${meta.sourceUserId}`
      : lastNotification.type === 'MATCH'
        ? '/matches'
        : '/notifications';

    playSound();

    toast.custom(
      (t) => (
        <div
          onClick={() => {
            toast.dismiss(t);
            if (typeof window !== 'undefined') {
              window.location.href = href;
            }
          }}
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg transition-colors hover:bg-accent"
        >
          <Icon size={18} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{lastNotification.title}</p>
            {lastNotification.body && (
              <p className="text-sm text-muted-foreground">{lastNotification.body}</p>
            )}
          </div>
        </div>
      ),
      { duration: 5000 },
    );

    showDesktopNotification(lastNotification.title, lastNotification.body);

    clearLastNotification();
  }, [lastNotification, clearLastNotification]);

  return <>{children}</>;
}
