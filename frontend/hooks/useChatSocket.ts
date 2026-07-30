'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { getQueue, addToQueue, removeFromQueue, incrementRetry, isOnline } from '@/lib/message-queue';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  attachments?: { url: string; type: string; name: string }[];
  createdAt: string;
  sender?: { profile?: { displayName: string; avatarUrl?: string } };
  reactions?: { id: string; emoji: string; userId: string }[];
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface TypingEvent {
  userId: string;
  isTyping: boolean;
}

let globalSocket: Socket | null = null;
let globalUserId: string | null = null;

function getSocket(token: string, userId: string): Socket {
  if (globalSocket && globalUserId === userId) {
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
    reconnectionAttempts: Infinity,
  });
  globalUserId = userId;
  return globalSocket;
}

function processQueue(socket: Socket, token: string, userId: string) {
  const queue = getQueue();
  if (queue.length === 0) return;
  for (const msg of queue) {
    if (!isOnline()) break;
    const retries = incrementRetry(msg.tempId);
    if (retries > 5) {
      removeFromQueue(msg.tempId);
      continue;
    }
    socket.emit('message:send', {
      conversationId: msg.conversationId,
      content: msg.content,
      tempId: msg.tempId,
      attachments: msg.attachments,
    }, (response: Message) => {
      if (response && response.id) {
        removeFromQueue(msg.tempId);
      }
    });
  }
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
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!token || !userId) return;

    const socket = getSocket(token, userId);

    const onConnect = () => {
      setIsConnected(true);
      if (conversationId) {
        console.log('🔗 JOINING ROOM on connect:', conversationId);
        socket.emit('conversation:join', conversationId);
        currentConvRef.current = conversationId;
      }
      processQueue(socket, token, userId);
    };

    const onDisconnect = () => setIsConnected(false);

    const onMessageNew = (msg: Message & { tempId?: string }) => {
      console.log('📥 RECEIVED message:new', { msgId: msg.id, convId: msg.conversationId, activeConvId: conversationId, content: msg.content?.slice(0, 50) });
      if (conversationId && msg.conversationId !== conversationId) {
        console.log('⏭️ IGNORED — conversationId mismatch');
        return;
      }
      setMessages((prev) => {
        const tempMatch = msg.tempId ? prev.findIndex((m) => m.id === msg.tempId) : -1;
        if (tempMatch >= 0) {
          const next = [...prev];
          next[tempMatch] = { ...msg, status: 'sent' };
          return next;
        }
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    };

    const onMessageUpdated = (msg: Message) => {
      if (conversationId && msg.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    };

    const onMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };

    const onMessageRead = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map((m) =>
          m.senderId !== data.userId ? { ...m, status: 'read' as const } : m
        ));
      }
    };

    const onMessageReaction = (data: { messageId: string; userId: string; emoji: string }) => {
      setMessages((prev) => prev.map((m) =>
        m.id === data.messageId
          ? {
              ...m,
              reactions: m.reactions
                ? m.reactions.some((r) => r.userId === data.userId)
                  ? m.reactions.map((r) => (r.userId === data.userId ? { ...r, emoji: data.emoji } : r))
                  : [...m.reactions, { id: data.messageId + data.userId, emoji: data.emoji, userId: data.userId }]
                : [{ id: data.messageId + data.userId, emoji: data.emoji, userId: data.userId }],
            }
          : m
      ));
    };

    const onTyping = (data: TypingEvent) => {
      if (data.isTyping) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.add(data.userId);
          return next;
        });
        const existing = typingTimeoutsRef.current.get(data.userId);
        if (existing) clearTimeout(existing);
        typingTimeoutsRef.current.set(data.userId, setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(data.userId);
            return next;
          });
          typingTimeoutsRef.current.delete(data.userId);
        }, 5000));
      } else {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
        const existing = typingTimeoutsRef.current.get(data.userId);
        if (existing) { clearTimeout(existing); typingTimeoutsRef.current.delete(data.userId); }
      }
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

    const onPresenceSync = (data: { onlineUsers: string[] }) => {
      setOnlineUsers(new Set(data.onlineUsers));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:new', onMessageNew);
    socket.on('message:updated', onMessageUpdated);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('message:read', onMessageRead);
    socket.on('message:reaction', onMessageReaction);
    socket.on('typing', onTyping);
    socket.on('user:online', onUserOnline);
    socket.on('user:offline', onUserOffline);
    socket.on('presence:sync', onPresenceSync);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', onMessageNew);
      socket.off('message:updated', onMessageUpdated);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('message:read', onMessageRead);
      socket.off('message:reaction', onMessageReaction);
      socket.off('typing', onTyping);
      socket.off('user:online', onUserOnline);
      socket.off('user:offline', onUserOffline);
      socket.off('presence:sync', onPresenceSync);
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
    };
  }, [token, userId, conversationId]);

  useEffect(() => {
    if (!token || !userId) return;
    const socket = getSocket(token, userId);

    console.log('🔄 EFFECT 2 — conversationId:', conversationId, 'currentConvRef:', currentConvRef.current);

    if (conversationId && conversationId !== currentConvRef.current) {
      if (currentConvRef.current) {
        console.log('🚪 LEAVING conversation:', currentConvRef.current);
        socket.emit('conversation:leave', currentConvRef.current);
        setMessages([]);
        setTypingUsers(new Set());
        messagesLoadedRef.current = false;
      }
      console.log('🚪 JOINING conversation:', conversationId);
      socket.emit('conversation:join', conversationId);
      currentConvRef.current = conversationId;
    }

    return () => {
      if (currentConvRef.current) {
        socket.emit('conversation:leave', currentConvRef.current);
        currentConvRef.current = undefined;
      }
    };
  }, [conversationId, token, userId]);

  const sendMessage = useCallback(
    (content: string, attachments?: { url: string; type: string; name: string }[], onSent?: (msg?: Message) => void) => {
      if (!token || !userId || !conversationId) return;
      const socket = getSocket(token, userId);
      const tempId = `offline-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const optimistic: Message = {
        id: tempId,
        conversationId,
        senderId: userId,
        content,
        attachments,
        createdAt: new Date().toISOString(),
        status: 'sending' as const,
        sender: { profile: { displayName: '' } },
      };
      setMessages((prev) => [...prev, optimistic].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ));

      const handleResponse = (response: Message) => {
        if (response && response.id) {
          removeFromQueue(tempId);
          setMessages((prev) => prev.map((m) =>
            m.id === tempId ? { ...response, status: 'sent' as const } : m
          ));
        } else if (response && (response as any).error) {
          setMessages((prev) => prev.map((m) =>
            m.id === tempId ? { ...m, status: 'sent' as const } : m
          ));
        }
        onSent?.(response);
      };

      if (!socket.connected || !isOnline()) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
        fetch(`${apiUrl}/chat/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, attachments }),
        })
          .then((r) => r.json())
          .then((data) => handleResponse(data))
          .catch(() => {
            addToQueue({
              tempId,
              conversationId,
              content,
              attachments,
              createdAt: new Date().toISOString(),
              retries: 0,
            });
            onSent?.(undefined);
          });
        return;
      }

      console.log('📤 SENDING MESSAGE:', { conversationId, content: content?.slice(0, 50), tempId, senderId: userId });

      socket.emit(
        'message:send',
        { conversationId, content, tempId, attachments },
        handleResponse,
      );
    },
    [token, userId, conversationId],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!token || !userId || !conversationId) return;
      const socket = getSocket(token, userId);
      if (!socket.connected) return;
      socket.emit('typing', { conversationId, isTyping });
    },
    [token, userId, conversationId],
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      if (!token || !userId) return;
      const socket = getSocket(token, userId);
      if (!socket.connected) return;
      socket.emit('message:edit', { messageId, content });
    },
    [token, userId],
  );

  const markConversationRead = useCallback(
    () => {
      if (!token || !userId || !conversationId) return;
      const socket = getSocket(token, userId);
      if (!socket.connected) return;
      socket.emit('conversation:read', conversationId);
    },
    [token, userId, conversationId],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      if (!token || !userId) return;
      const socket = getSocket(token, userId);
      if (!socket.connected) return;
      socket.emit('message:delete', { messageId });
    },
    [token, userId],
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!token || !userId) return;
      const socket = getSocket(token, userId);
      if (!socket.connected) return;
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
    markConversationRead,
    setInitialMessages,
  };
}
