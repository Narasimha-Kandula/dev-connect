'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  attachments?: { url: string; type: string; name: string }[];
  createdAt: string;
  sender?: { profile?: { displayName: string; avatarUrl?: string } };
  reactions?: { id: string; emoji: string; userId: string }[];
}

interface TypingEvent {
  userId: string;
  isTyping: boolean;
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
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });
  globalUserId = userId;
  return globalSocket;
}

export function useChatSocket(conversationId?: string) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const messagesLoadedRef = useRef(false);
  const currentConvRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!token || !userId) return;

    const socket = getSocket(token, userId);

    const onConnect = () => {
      setIsConnected(true);
      if (conversationId) {
        socket.emit('conversation:join', conversationId);
        currentConvRef.current = conversationId;
      }
    };

    const onDisconnect = () => setIsConnected(false);

    const onMessageNew = (msg: Message) => {
      if (msg.conversationId !== currentConvRef.current) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    };

    const onMessageUpdated = (msg: Message) => {
      if (msg.conversationId !== currentConvRef.current) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    };

    const onMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };

    const onTyping = (data: TypingEvent) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (data.isTyping) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    };

    const onUserOnline = (data: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(data.userId));
    };

    const onUserOffline = (data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:new', onMessageNew);
    socket.on('message:updated', onMessageUpdated);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('typing', onTyping);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', onMessageNew);
      socket.off('message:updated', onMessageUpdated);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('typing', onTyping);
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
    };
  }, [token, userId]);

  useEffect(() => {
    if (!token || !userId) return;
    const socket = getSocket(token, userId);

    if (conversationId && conversationId !== currentConvRef.current) {
      if (currentConvRef.current) {
        socket.emit('conversation:leave', currentConvRef.current);
      }
      socket.emit('conversation:join', conversationId);
      currentConvRef.current = conversationId;
      setMessages([]);
      setTypingUsers(new Set());
      messagesLoadedRef.current = false;
    }

    return () => {
      if (currentConvRef.current) {
        socket.emit('conversation:leave', currentConvRef.current);
        currentConvRef.current = undefined;
      }
    };
  }, [conversationId, token, userId]);

  const sendMessage = useCallback(
    (content: string, attachments?: { url: string; type: string; name: string }[]) => {
      if (!token || !userId || !conversationId) return;
      const socket = getSocket(token, userId);
      socket.emit(
        'message:send',
        { conversationId, content, attachments },
        (response: Message) => {
          if (response && response.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === response.id)) return prev;
              return [...prev, response].sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              );
            });
          }
        },
      );
    },
    [token, userId, conversationId],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!token || !userId || !conversationId) return;
      const socket = getSocket(token, userId);
      socket.emit('typing', { conversationId, isTyping });
    },
    [token, userId, conversationId],
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!token || !userId) return;
      const socket = getSocket(token, userId);
      socket.emit('message:edit', { messageId, content });
    },
    [token, userId],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!token || !userId) return;
      const socket = getSocket(token, userId);
      socket.emit('message:delete', { messageId });
    },
    [token, userId],
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!token || !userId) return;
      const socket = getSocket(token, userId);
      socket.emit('message:react', { messageId, emoji });
    },
    [token, userId],
  );

  const setInitialMessages = useCallback((msgs: Message[]) => {
    if (!messagesLoadedRef.current) {
      setMessages(msgs);
      messagesLoadedRef.current = true;
    }
  }, []);

  return {
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    sendMessage,
    sendTyping,
    editMessage,
    deleteMessage,
    addReaction,
    setInitialMessages,
  };
}
