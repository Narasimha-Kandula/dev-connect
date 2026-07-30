'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Avatar } from '@/lib/avatar';

interface PresenceUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  status: 'online' | 'away';
}

interface PresenceListProps {
  roomId: string;
  currentUserId: string;
}

export function PresenceList({ roomId, currentUserId }: PresenceListProps) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
    const s = io(wsUrl, {
      transports: ['websocket', 'polling'],
      query: { roomId },
    });

    s.on('connect', () => {
      s.emit('room:join', { roomId });
    });

    s.on('room:users', (data: { users: PresenceUser[] }) => {
      setUsers(data.users);
    });

    s.on('user:online', (data: PresenceUser) => {
      setUsers((prev) => {
        const existing = prev.find((u) => u.userId === data.userId);
        if (existing) return prev.map((u) => (u.userId === data.userId ? { ...u, status: 'online' as const } : u));
        return [...prev, data];
      });
    });

    s.on('user:offline', (data: { userId: string }) => {
      setUsers((prev) => prev.map((u) => (u.userId === data.userId ? { ...u, status: 'away' as const } : u)));
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [roomId]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Online — {users.filter((u) => u.status === 'online').length}
      </p>
      <div className="flex flex-col gap-1.5">
        {users.map((u) => (
          <div key={u.userId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50">
            <span className={`h-2 w-2 rounded-full ${u.status === 'online' ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
            <Avatar src={u.avatarUrl} name={u.displayName} size="xs" />
            <span className="truncate">{u.displayName}{u.userId === currentUserId ? ' (you)' : ''}</span>
          </div>
        ))}
        {users.length === 0 && (
          <p className="px-2 text-xs text-muted-foreground">No one else is here</p>
        )}
      </div>
    </div>
  );
}
