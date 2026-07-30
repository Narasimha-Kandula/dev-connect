'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

export interface NotificationEvent {
  id: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  metadata?: unknown;
  isRead: boolean;
  createdAt: string;
}

let globalSocket: Socket | null = null;
let globalUserId: string | null = null;

function getSocket(token: string, userId: string): Socket {
  if (globalSocket && globalUserId === userId && globalSocket.connected) {
    return globalSocket;
  }
  if (globalSocket) {
    globalSocket.close();
  }
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
  globalSocket = io(wsUrl, {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
  globalUserId = userId;
  return globalSocket;
}

export function useNotificationSocket() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<NotificationEvent | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token || !userId) return;

    const socket = getSocket(token, userId);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onNotification = (data: NotificationEvent) => {
      setLastNotification(data);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification:new', onNotification);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification:new', onNotification);
    };
  }, [token, userId]);

  useEffect(() => {
    if (!token) return;

    const fetchUnread = async () => {
      try {
        const { api } = await import('@/lib/api');
        const count = await api.get<number>('/notifications/unread', token);
        setUnreadCount(typeof count === 'number' ? count : 0);
      } catch {}
    };

    fetchUnread();

    intervalRef.current = setInterval(fetchUnread, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token]);

  const clearLastNotification = useCallback(() => setLastNotification(null), []);

  const resetUnreadCount = useCallback(() => setUnreadCount(0), []);

  return {
    isConnected,
    lastNotification,
    unreadCount,
    clearLastNotification,
    resetUnreadCount,
  };
}
