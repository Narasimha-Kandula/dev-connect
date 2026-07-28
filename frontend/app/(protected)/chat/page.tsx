'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useChatSocket } from '@/hooks/useChatSocket';
import { Send, Loader2, ArrowLeft, MessageSquare, Search, Plus, X } from 'lucide-react';

interface Member {
  userId: string;
  user: { id: string; profile?: { displayName: string; avatarUrl?: string } };
}

interface Conversation {
  id: string;
  members: Member[];
  messages?: { content?: string; createdAt: string }[];
  isGroup?: boolean;
  name?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  attachments?: { url: string; type: string; name: string }[];
  createdAt: string;
  sender?: { profile?: { displayName: string; avatarUrl?: string } };
  reactions?: { id: string; emoji: string; userId: string }[];
}

interface SearchResult {
  id: string;
  profile?: { displayName: string; avatarUrl?: string; headline?: string };
}

function ChatInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convId = searchParams.get('conv');
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    messages,
    typingUsers,
    onlineUsers,
    sendMessage,
    sendTyping,
    setInitialMessages,
  } = useChatSocket(convId || undefined);

  const fetchConversations = useCallback(() => {
    if (!token) return;
    api.get<Conversation[]>('/chat/conversations', token).then(setConversations).catch(() => {});
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!token || !convId) return;
    setLoading(true);
    api.get<Message[]>(`/chat/conversations/${convId}/messages`, token)
      .then((msgs) => {
        setInitialMessages(msgs.reverse());
        setLoading(false);
      })
      .catch(() => {
        setInitialMessages([]);
        setLoading(false);
      });
  }, [convId, token, setInitialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!text.trim() || !convId) return;
      setSending(true);
      sendMessage(text.trim());
      setText('');
      setSending(false);
    },
    [text, convId, sendMessage],
  );

  const handleTyping = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
      sendTyping(e.target.value.length > 0);
    },
    [sendTyping],
  );

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (query.length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        if (!token) return;
        api
          .get<SearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`, token)
          .then((users) => setSearchResults(users.filter((u) => u.id !== userId)))
          .catch(() => setSearchResults([]))
          .finally(() => setSearching(false));
      }, 300);
    },
    [token, userId],
  );

  const startChat = useCallback(
    async (targetUserId: string) => {
      if (!token) return;
      try {
        const conv = await api.post<Conversation>('/chat/conversations', { targetUserId }, token);
        setConversations((prev) => {
          if (prev.some((c) => c.id === conv.id)) return prev;
          return [conv, ...prev];
        });
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
        router.push(`/chat?conv=${conv.id}`);
      } catch {}
    },
    [token, router],
  );

  function partnerName(conv: Conversation) {
    if (!userId) return 'Unknown';
    if (conv.isGroup && conv.name) return conv.name;
    const other = conv.members.find((m) => m.userId !== userId);
    return other?.user?.profile?.displayName ?? 'User';
  }

  function partnerUserId(conv: Conversation) {
    if (!userId) return undefined;
    return conv.members.find((m) => m.userId !== userId)?.userId;
  }

  function lastMsg(conv: Conversation) {
    return conv.messages?.[0]?.content ?? 'No messages yet';
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const activeConv = conversations.find((c) => c.id === convId);
  const activeOtherUserId = partnerUserId(activeConv!);

  return (
    <div className="mx-auto flex max-w-6xl h-[calc(100vh-4rem)] px-4 py-4">
      <div className="flex flex-1 gap-4 h-full">
        {/* Sidebar */}
        <div className={`w-80 shrink-0 flex flex-col ${convId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight">Messages</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title="Start new chat"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* New Chat Search */}
          {showSearch && (
            <div className="mb-3 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search developers..."
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </div>
              {searching && (
                <div className="flex justify-center py-2">
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                </div>
              )}
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startChat(u.id)}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {u.profile?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{u.profile?.displayName ?? 'User'}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.profile?.headline ?? 'Developer'}</p>
                  </div>
                </button>
              ))}
              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No users found</p>
              )}
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 space-y-1 overflow-y-auto pr-2">
            {conversations.length === 0 && !showSearch && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/70 mb-3">Find a match to start chatting</p>
                <Button size="sm" variant="secondary" onClick={() => setShowSearch(true)}>
                  <Plus size={14} className="mr-1" /> Start Chat
                </Button>
              </div>
            )}
            {conversations.map((c) => {
              const pUid = partnerUserId(c);
              const isOnline = pUid ? onlineUsers.has(pUid) : false;
              return (
                <button
                  key={c.id}
                  onClick={() => router.push(`/chat?conv=${c.id}`)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-left ${
                    c.id === convId ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {partnerName(c).charAt(0).toUpperCase()}
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{partnerName(c)}</p>
                    <p className="truncate text-xs text-muted-foreground">{lastMsg(c)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <Card className={`flex flex-1 flex-col ${!convId ? 'hidden lg:flex' : 'flex'}`}>
          {!convId ? (
            <CardContent className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
              <div className="space-y-2">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p>Choose a conversation from the sidebar</p>
                <p className="text-xs">Or start a new one by clicking +</p>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-background/50">
                <button
                  onClick={() => router.push('/chat')}
                  className="lg:hidden p-2 hover:bg-muted rounded-lg"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {partnerName(activeConv!).charAt(0).toUpperCase()}
                  {activeOtherUserId && onlineUsers.has(activeOtherUserId) && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{partnerName(activeConv!)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {activeOtherUserId && onlineUsers.has(activeOtherUserId)
                      ? 'Online'
                      : isConnected
                        ? 'Offline'
                        : 'Connecting...'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loading && (
                  <div className="flex justify-center">
                    <Loader2 className="animate-spin text-muted-foreground" />
                  </div>
                )}
                {!loading && messages.length === 0 && (
                  <p className="pt-10 text-center text-sm text-muted-foreground">
                    No messages yet — say hello!
                  </p>
                )}
                {messages.map((msg) => {
                  const isMe = msg.senderId === userId;
                  const senderName = msg.sender?.profile?.displayName ?? 'Unknown';
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] ${isMe ? '' : 'flex flex-col items-start'}`}
                      >
                        {!isMe && (
                          <p className="text-xs text-muted-foreground mb-1 ml-1">
                            {senderName}
                          </p>
                        )}
                        <div
                          className={`relative rounded-2xl px-4 py-2 text-sm ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                          <span
                            className={`absolute bottom-0 right-0 mb-1 mr-1 text-[10px] ${
                              isMe ? 'text-primary-foreground/60' : 'text-muted-foreground/60'
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
                  {Array.from(typingUsers)
                    .map((id) => {
                      const user = activeConv?.members.find((m) => m.userId === id);
                      return user
                        ? `${user.user.profile?.displayName} is typing…`
                        : 'Someone is typing…';
                    })
                    .join(', ')}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-border p-4 bg-background/50"
              >
                <input
                  value={text}
                  onChange={handleTyping}
                  placeholder="Type a message…"
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={sending || !text.trim()}
                  size="sm"
                  className="h-10 w-10"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Loading messages…
        </div>
      }
    >
      <ChatInner />
    </Suspense>
  );
}
