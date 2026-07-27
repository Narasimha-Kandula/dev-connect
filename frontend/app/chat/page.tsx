'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface ConversationRow {
  id: string;
  members: { user: { profile?: { displayName: string } } }[];
  messages: { content?: string }[];
}
interface MessageRow {
  id: string;
  content?: string;
  senderId: string;
  createdAt: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  useEffect(() => {
    if (!token) return;

    const decoded = JSON.parse(atob(token.split('.')[1]));
    setCurrentUserId(decoded.sub ?? decoded.id);

    api.get<ConversationRow[]>('/chat/conversations', token).then(setConversations).catch(() => {});

    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:4000'}/ws/chat`, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('message:new', (msg: MessageRow) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('typing', (data: { userId: string; conversationId?: string; isTyping: boolean }) => {
      const cid = data.conversationId ?? activeId;
      if (!cid) return;
      setTypingUsers((prev) => {
        const list = prev[cid] ?? [];
        const updated = data.isTyping
          ? list.includes(data.userId)
            ? list
            : [...list, data.userId]
          : list.filter((id) => id !== data.userId);
        return { ...prev, [cid]: updated };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [token, activeId]);

  function openConversation(id: string) {
    setActiveId(id);
    socketRef.current?.emit('conversation:join', id);
    socketRef.current?.emit('typing', { conversationId: id, isTyping: false });
    api.get<MessageRow[]>(`/chat/conversations/${id}/messages`, token).then((msgs) =>
      setMessages([...msgs].reverse()),
    );
  }

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeId || !socketRef.current) return;
      socketRef.current.emit('typing', { conversationId: activeId, isTyping });
    },
    [activeId],
  );

  function handleInputChange(value: string) {
    setDraft(value);
    emitTyping(value.length > 0);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2000);
  }

  function sendMessage() {
    if (!draft.trim() || !activeId) return;
    socketRef.current?.emit('message:send', { conversationId: activeId, content: draft });
    setDraft('');
    emitTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }

  return (
    <div className="mx-auto grid h-[80vh] max-w-6xl grid-cols-1 gap-4 px-6 py-10 md:grid-cols-3">
      <div className="space-y-2 overflow-y-auto rounded-xl border border-border p-3 md:col-span-1">
        <h2 className="mb-2 px-2 text-sm font-semibold text-muted-foreground">Conversations</h2>
        {conversations.map((c) => {
          const typing = (typingUsers[c.id] ?? []).filter((id) => id !== currentUserId);
          return (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <p className="font-medium">
                {c.members.map((m) => m.user.profile?.displayName).join(', ')}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {typing.length > 0
                  ? 'typing...'
                  : c.messages[0]?.content ?? 'No messages yet'}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col rounded-xl border border-border md:col-span-2">
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {!activeId ? (
            <p className="text-sm text-muted-foreground">Select a conversation to start chatting.</p>
          ) : (
            <>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    m.senderId === currentUserId
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {(typingUsers[activeId] ?? []).filter((id) => id !== currentUserId).length > 0 && (
                <p className="text-xs text-muted-foreground italic">Someone is typing...</p>
              )}
            </>
          )}
        </div>
        {activeId && (
          <div className="flex gap-2 border-t border-border p-3">
            <input
              value={draft}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message…"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        )}
      </div>
    </div>
  );
}
