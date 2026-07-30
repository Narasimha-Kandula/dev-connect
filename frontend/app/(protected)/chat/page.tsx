'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useChatSocket } from '@/hooks/useChatSocket';
import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import {
  Send, Loader2, MessageSquare, Search, Plus, X, Paperclip,
  ImageIcon, FileText, CheckCheck, ChevronLeft, Smile,
  ChevronDown, Trash2, Pencil, Reply, Mic, AudioLines, Users,
} from 'lucide-react';
import { Avatar } from '@/lib/avatar';
import { toast as sonnerToast } from 'sonner';

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

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  attachments?: { url: string; type: string; name: string }[];
  createdAt: string;
  sender?: { profile?: { displayName: string; avatarUrl?: string } };
  reactions?: { id: string; emoji: string; userId: string }[];
  status?: MessageStatus;
}

interface SearchResult {
  id: string;
  profile?: { displayName: string; avatarUrl?: string; headline?: string };
}

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  { name: 'Smileys', emojis: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤩', '😜', '🤗', '😇', '🙃', '🤔', '🤨', '😐', '😏', '😒', '😬', '😢', '😭', '😤', '😡', '🥺', '😴', '🤤', '😵', '🤯'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞', '🫶', '👋', '🤙', '👌', '✋', '💅', '🙏', '🤲'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❤️‍🔥', '💖', '💗', '💝', '💘', '💕', '💞'] },
  { name: 'Objects', emojis: ['🔥', '⭐', '⚡', '💯', '🎉', '🎊', '✨', '🎯', '🏆', '💡', '📌', '🔔', '📢', '💎', '🧠', '👀'] },
];

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function formatMsgTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function shouldShowDateSeparator(msgs: ChatMessage[], idx: number) {
  if (idx === 0) return true;
  return !isSameDay(msgs[idx].createdAt, msgs[idx - 1].createdAt);
}

function ImagePreviewModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"><X size={24} /></button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={name} className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}



function ContextMenu({ x, y, isOwn, onClose, onReply, onEdit, onDelete, onReact }: {
  x: number; y: number; isOwn: boolean;
  onClose: () => void; onReply: () => void; onEdit: () => void; onDelete: () => void; onReact: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);
  const menuX = Math.min(x, window.innerWidth - 180);
  const menuY = Math.min(y, window.innerHeight - 200);
  return (
    <div ref={ref} className="fixed z-50 w-44 rounded-xl border border-border bg-card shadow-xl py-1 animate-in fade-in zoom-in-95" style={{ left: menuX, top: menuY }}>
      {isOwn && <>
        <button onClick={() => { onEdit(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 text-left"><Pencil size={15} /> Edit</button>
        <button onClick={() => { onReply(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 text-left"><Reply size={15} /> Reply</button>
      </>}
      {!isOwn && <button onClick={() => { onReply(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 text-left"><Reply size={15} /> Reply</button>}
      <button onClick={() => { onReact(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 text-left"><Smile size={15} /> React</button>
      {isOwn && <button onClick={() => { onDelete(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 text-left text-danger"><Trash2 size={15} /> Delete</button>}
    </div>
  );
}

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const [cat, setCat] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute bottom-14 left-0 z-50 w-72 rounded-xl border border-border bg-card shadow-xl p-3 animate-in fade-in zoom-in-95">
      <div className="flex gap-1 mb-2 overflow-x-auto">
        {EMOJI_CATEGORIES.map((c, i) => (
          <button key={c.name} onClick={() => setCat(i)} className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${i === cat ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>{c.name}</button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 max-h-40 overflow-y-auto">
        {EMOJI_CATEGORIES[cat].emojis.map((e) => (
          <button key={e} onClick={() => onSelect(e)} className="p-1.5 rounded-lg hover:bg-muted/50 text-lg transition-colors">{e}</button>
        ))}
      </div>
    </div>
  );
}

function ScrollToBottomBtn({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  if (!visible) return null;
  return (
    <button onClick={onClick} className="absolute bottom-4 right-6 z-20 p-2 rounded-full bg-card border border-border shadow-lg hover:bg-muted/50 transition-all animate-in fade-in">
      <ChevronDown size={18} className="text-muted-foreground" />
    </button>
  );
}

function ChatInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convId = searchParams.get('conv');
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: ChatMessage } | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [previewImg, setPreviewImg] = useState<{ url: string; name: string } | null>(null);

  const [pendingAttachments, setPendingAttachments] = useState<{ url: string; type: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [msgSearchResults, setMsgSearchResults] = useState<number[]>([]);
  const [msgSearchIdx, setMsgSearchIdx] = useState(0);
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMemberQuery, setAddMemberQuery] = useState('');
  const [addMemberResults, setAddMemberResults] = useState<SearchResult[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const addMemberTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
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
  } = useChatSocket(convId || undefined);

  const fetchConversations = useCallback(() => {
    if (!token) return;
    setConvLoading(true);
    api.get<Conversation[]>('/chat/conversations', token).then(setConversations).catch(() => {}).finally(() => setConvLoading(false));
  }, [token]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const handleAddMemberSearch = useCallback((q: string) => {
    setAddMemberQuery(q);
    if (addMemberTimeoutRef.current) clearTimeout(addMemberTimeoutRef.current);
    if (q.length < 2) { setAddMemberResults([]); return; }
    addMemberTimeoutRef.current = setTimeout(() => {
      if (!token) return;
      api.get<SearchResult[]>(`/users/search?q=${encodeURIComponent(q)}`, token)
        .then((users) => {
          const conv = conversations.find((c) => c.id === convId);
          const already = conv?.members.map((m) => m.userId) ?? [];
          setAddMemberResults(users.filter((u) => u.id !== userId && !already.includes(u.id)));
        })
        .catch(() => setAddMemberResults([]));
    }, 300);
  }, [token, userId, conversations, convId]);

  const handleAddMembers = useCallback(async (memberId: string) => {
    if (!token || !convId) return;
    setAddingMember(true);
    try {
      await api.post(`/chat/conversations/${convId}/members`, { memberIds: [memberId] }, token);
      sonnerToast.success('Member added');
      setShowAddMembers(false);
      setAddMemberQuery('');
      setAddMemberResults([]);
      fetchConversations();
    } catch {
      sonnerToast.error('Failed to add member');
    }
    setAddingMember(false);
  }, [token, convId, fetchConversations]);

  useEffect(() => {
    if (!token || !convId) return;
    setLoading(true);
    api.get<ChatMessage[]>(`/chat/conversations/${convId}/messages`, token)
      .then((msgs) => { setInitialMessages(msgs.reverse()); setLoading(false); })
      .catch(() => { setInitialMessages([]); setLoading(false); });
  }, [convId, token, setInitialMessages]);

  useEffect(() => {
    if (!isScrolledUp) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isScrolledUp]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsScrolledUp(dist > 150);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && pendingAttachments.length === 0) || !convId) return;
    setSending(true);
    sendMessage(text.trim(), pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setText('');
    setPendingAttachments([]);
    setReplyingTo(null);
    setSending(false);
  }, [text, pendingAttachments, convId, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  }, [handleSend]);

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    sendTyping(e.target.value.length > 0);
  }, [sendTyping]);

  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyingTo(msg);
    setEditingMsgId(null);
  }, []);

  const handleEdit = useCallback((msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setText(msg.content ?? '');
    setReplyingTo(null);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editingMsgId || !text.trim()) return;
    editMessage(editingMsgId, text.trim());
    setEditingMsgId(null);
    setText('');
    sonnerToast.success('Message edited');
  }, [editingMsgId, text, editMessage]);

  const handleDelete = useCallback((msg: ChatMessage) => {
    if (editingMsgId) return;
    deleteMessage(msg.id);
    sonnerToast.success('Message deleted');
  }, [editingMsgId, deleteMessage]);

  const handleReact = useCallback((msg: ChatMessage) => {
    addReaction(msg.id, '👍');
  }, [addReaction]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, msg: ChatMessage) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 2) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      if (!token) return;
      api.get<SearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`, token)
        .then((users) => setSearchResults(users.filter((u) => u.id !== userId)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
  }, [token, userId]);

  const startChat = useCallback(async (targetUserId: string) => {
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
  }, [token, router]);

  const deleteConversation = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await api.delete(`/chat/conversations/${id}`, token);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (convId === id) router.push('/chat');
    } catch {}
  }, [token, convId, router]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/upload`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
      });
      const data = await res.json();
      if (data.url) {
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'voice' : 'file';
        setPendingAttachments((prev) => [...prev, { url: data.url, type, name: file.name }]);
      }
    } catch { sonnerToast.error('Upload failed'); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [token]);

  const handleMsgSearch = useCallback((query: string) => {
    setMsgSearchQuery(query);
    if (!query.trim()) { setMsgSearchResults([]); return; }
    const q = query.toLowerCase();
    const indices: number[] = [];
    messages.forEach((m, i) => { if (m.content?.toLowerCase().includes(q)) indices.push(i); });
    setMsgSearchResults(indices);
    setMsgSearchIdx(0);
    if (indices.length > 0) {
      const el = document.getElementById(`msg-${messages[indices[0]].id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [messages]);

  const goToMsgSearchResult = useCallback((dir: 'prev' | 'next') => {
    if (msgSearchResults.length === 0) return;
    const idx = dir === 'next'
      ? (msgSearchIdx + 1) % msgSearchResults.length
      : (msgSearchIdx - 1 + msgSearchResults.length) % msgSearchResults.length;
    setMsgSearchIdx(idx);
    const el = document.getElementById(`msg-${messages[msgSearchResults[idx]].id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [msgSearchResults, msgSearchIdx, messages]);

  const userReacted = (msg: ChatMessage, emoji: string) =>
    msg.reactions?.some((r) => r.emoji === emoji && r.userId === userId) ?? false;

  const reactionCount = (msg: ChatMessage, emoji: string) =>
    msg.reactions?.filter((r) => r.emoji === emoji).length ?? 0;

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

  function partnerAvatarUrl(conv: Conversation) {
    if (!userId) return undefined;
    const other = conv.members.find((m) => m.userId !== userId);
    return other?.user?.profile?.avatarUrl;
  }

  function lastMsg(conv: Conversation) {
    return conv.messages?.[0]?.content ?? 'No messages yet';
  }

  const activeConv = conversations.find((c) => c.id === convId);
  const activeOtherUserId = activeConv ? partnerUserId(activeConv) : undefined;

  return (
    <div className="mx-auto flex max-w-6xl h-[calc(100vh-4rem)] px-4 py-4">
      <div className="flex flex-1 gap-4 h-full">
        {/* Sidebar */}
        <div className={`w-80 shrink-0 flex flex-col ${convId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold tracking-tight">Messages</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
              <button onClick={() => setShowSearch(!showSearch)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="New chat"><Plus size={16} /></button>
            </div>
          </div>

          {showSearch && (
            <div className="mb-3 space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search developers..." className="w-full rounded-lg border border-input bg-background pl-9 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" autoFocus />
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={14} /></button>
              </div>
              {searching && <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin text-muted-foreground" /></div>}
              {searchResults.map((u) => (
                <button key={u.id} onClick={() => startChat(u.id)} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left">
                  <Avatar src={u.profile?.avatarUrl} name={u.profile?.displayName ?? '?'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{u.profile?.displayName ?? 'User'}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.profile?.headline ?? 'Developer'}</p>
                  </div>
                </button>
              ))}
              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No users found</p>}
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {convLoading && conversations.length === 0 && (
              <div className="px-4 py-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-muted/30" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-muted/30" />
                      <div className="h-2.5 w-32 rounded bg-muted/20" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!convLoading && conversations.length === 0 && !showSearch && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground/70 mb-3">Find a match to start chatting</p>
                <button onClick={() => setShowSearch(true)} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 flex items-center gap-2"><Plus size={16} /> Start Chat</button>
              </div>
            )}
            {conversations.length > 0 && (
              <Virtuoso style={{ height: '100%' }} data={conversations} itemContent={(_, c) => {
                const pUid = partnerUserId(c);
                const isOnline = pUid ? onlineUsers.has(pUid) : false;
                return (
                  <div className="group relative">
                    <button onClick={() => router.push(`/chat?conv=${c.id}`)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left rounded-lg ${c.id === convId ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                      <div className="relative shrink-0">
                        <Avatar src={partnerAvatarUrl(c)} name={partnerName(c)} size="lg" />
                        {isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-card" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-medium text-sm">{partnerName(c)}</p>
                          <span className="shrink-0 text-[11px] text-muted-foreground ml-2">{c.messages?.[0]?.createdAt ? formatTime(c.messages[0].createdAt) : ''}</span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground mt-0.5">{lastMsg(c)}</p>
                      </div>
                    </button>
                    {c.id === convId && (
                      <button onClick={() => deleteConversation(c.id)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground hover:text-danger hover:bg-muted/30 opacity-0 group-hover:opacity-100" title="Delete"><Trash2 size={14} /></button>
                    )}
                  </div>
                );
              }} />
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex flex-1 flex-col rounded-xl border border-border bg-card ${!convId ? 'hidden lg:flex' : 'flex'}`}>
          {!convId ? (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
              <div className="space-y-2">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p>Choose a conversation from the sidebar</p>
                <p className="text-xs">Or start a new one by clicking +</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 shrink-0">
                <button onClick={() => router.push('/chat')} className="lg:hidden p-1.5 hover:bg-muted rounded-lg"><ChevronLeft size={20} /></button>
                <div className="relative shrink-0">
                  <Avatar src={activeConv ? partnerAvatarUrl(activeConv) : undefined} name={activeConv ? partnerName(activeConv) : '?'} size="lg" />
                  {activeOtherUserId && onlineUsers.has(activeOtherUserId) && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{activeConv ? partnerName(activeConv) : 'Loading...'}</p>
                  <p className="truncate text-xs text-muted-foreground">{activeOtherUserId && onlineUsers.has(activeOtherUserId) ? 'Online' : isConnected ? 'Offline' : 'Connecting...'}</p>
                </div>
                <div className="relative">
                  <button onClick={() => { setShowMsgSearch(false); setShowAddMembers(!showAddMembers); }} className="p-1.5 rounded-full hover:bg-muted/30 text-muted-foreground" title="Add members"><Users size={16} /></button>
                </div>
                <div className="relative">
                  <button onClick={() => { setShowAddMembers(false); setShowMsgSearch(!showMsgSearch); }} className="p-1.5 rounded-full hover:bg-muted/30 text-muted-foreground"><Search size={16} /></button>
                  {showMsgSearch && (
                    <div className="absolute right-0 top-10 z-30 w-64 rounded-lg border border-border bg-card shadow-xl p-2 animate-in fade-in zoom-in-95">
                      <div className="flex items-center gap-1">
                        <input value={msgSearchQuery} onChange={(e) => handleMsgSearch(e.target.value)} placeholder="Search in chat..." className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring" autoFocus />
                        <button onClick={() => goToMsgSearchResult('prev')} className="p-1 hover:bg-muted rounded" title="Previous"><ChevronDown size={14} className="rotate-180" /></button>
                        <button onClick={() => goToMsgSearchResult('next')} className="p-1 hover:bg-muted rounded" title="Next"><ChevronDown size={14} /></button>
                        <button onClick={() => { setShowMsgSearch(false); setMsgSearchQuery(''); setMsgSearchResults([]); }} className="p-1 hover:bg-muted rounded"><X size={14} /></button>
                      </div>
                      {msgSearchResults.length > 0 && <p className="text-[11px] text-muted-foreground mt-1.5 px-1">{msgSearchIdx + 1} of {msgSearchResults.length}</p>}
                    </div>
                  )}
                </div>
                {showAddMembers && (
                  <div className="absolute right-0 top-12 z-30 w-64 rounded-lg border border-border bg-card shadow-xl p-2 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-1 mb-2">
                      <input value={addMemberQuery} onChange={(e) => handleAddMemberSearch(e.target.value)} placeholder="Search users..." className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring" autoFocus />
                      <button onClick={() => { setShowAddMembers(false); setAddMemberQuery(''); setAddMemberResults([]); }} className="p-1 hover:bg-muted rounded"><X size={14} /></button>
                    </div>
                    {addMemberResults.length > 0 && (
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {addMemberResults.map((u) => (
                          <button key={u.id} onClick={() => handleAddMembers(u.id)} disabled={addingMember} className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50 transition-colors text-left disabled:opacity-50">
                            <Avatar src={u.profile?.avatarUrl} name={u.profile?.displayName ?? '?'} size="xs" />
                            <span className="truncate flex-1">{u.profile?.displayName ?? 'User'}</span>
                            <Plus size={12} className="shrink-0 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                    {addMemberQuery.length >= 2 && addMemberResults.length === 0 && (
                      <p className="text-[11px] text-muted-foreground text-center py-2">No users found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-hidden px-4 py-3 relative" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0)', backgroundSize: '24px 24px', backgroundColor: 'var(--color-background)' }} role="log" aria-live="polite" aria-label="Message list">
                <ScrollToBottomBtn visible={isScrolledUp} onClick={scrollToBottom} />

                {loading && (
                  <div className="flex justify-center py-10">
                    <div className="flex items-center gap-3 text-muted-foreground"><Loader2 className="animate-spin" size={18} /><span className="text-sm">Loading messages…</span></div>
                  </div>
                )}

                {!loading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-sm text-muted-foreground font-medium">No messages yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Send a message to start chatting</p>
                  </div>
                )}

                {messages.length > 0 && (
                  <Virtuoso style={{ height: '100%' }} data={messages} followOutput="smooth" itemContent={(idx, msg) => {
                    const isMe = msg.senderId === userId;
                    const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId);
                    const showDate = shouldShowDateSeparator(messages, idx);
                    const isHighlighted = msgSearchResults.includes(idx) && msgSearchResults[msgSearchIdx] === idx;

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="px-3 py-1 rounded-full bg-card/80 text-[11px] text-muted-foreground shadow-sm border border-border/50 backdrop-blur-sm">{formatDateSeparator(msg.createdAt)}</span>
                          </div>
                        )}
                        <motion.div id={`msg-${msg.id}`} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-1.5 mb-1 ${isHighlighted ? 'bg-primary/5 -mx-4 px-4 py-1 rounded-lg' : ''}`} onContextMenu={(e) => handleContextMenu(e, msg)}>
                          {replyingTo?.id === msg.id && (
                            <div className="absolute -top-6 left-0 right-0 px-2 py-0.5 bg-primary/10 rounded-t-lg text-[10px] text-primary"><Reply size={10} className="inline mr-1" />Replying</div>
                          )}
                          {!isMe && (
                            <div className="w-7 shrink-0 self-end pb-1">
                              {showAvatar ? <Avatar src={msg.sender?.profile?.avatarUrl} name={msg.sender?.profile?.displayName ?? '?'} size="xs" /> : <div className="h-7 w-7" />}
                            </div>
                          )}
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] group`}>
                            <div className={`relative px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words transition-all ${isMe ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm' : 'bg-card text-card-foreground rounded-2xl rounded-bl-sm shadow-sm border border-border/30'} ${editingMsgId === msg.id ? 'ring-2 ring-primary' : ''}`}>
                              {msg.content && <span>{msg.content}</span>}
                              {msg.attachments?.map((att, i) => (
                                <div key={i} className={msg.content ? 'mt-1.5' : ''}>
                                  {att.type === 'image' ? (
                                    <button onClick={() => setPreviewImg({ url: att.url, name: att.name })} className="block">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={att.url} alt={att.name} className="max-w-48 rounded-lg cursor-pointer hover:opacity-90" />
                                    </button>
                                  ) : att.type === 'voice' ? (
                                    <div className="flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2 min-w-[180px]">
                                      <AudioLines size={16} className="text-primary shrink-0" />
                                      <audio controls className="h-8 w-full" src={att.url} preload="metadata">Your browser does not support audio.</audio>
                                    </div>
                                  ) : (
                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2 text-xs hover:bg-background/60">
                                      <FileText size={14} />
                                      <span className="truncate max-w-[120px]">{att.name}</span>
                                    </a>
                                  )}
                                </div>
                              ))}
                              {msg.reactions && Object.entries(
                                msg.reactions.reduce<Record<string, string[]>>((acc, r) => {
                                  if (!acc[r.emoji]) acc[r.emoji] = [];
                                  acc[r.emoji].push(r.userId);
                                  return acc;
                                }, {})
                              ).length > 0 && (
                                <div className="flex flex-wrap gap-0.5 mt-1.5">
                                  {Object.entries(
                                    msg.reactions.reduce<Record<string, string[]>>((acc, r) => {
                                      if (!acc[r.emoji]) acc[r.emoji] = [];
                                      acc[r.emoji].push(r.userId);
                                      return acc;
                                    }, {})
                                  ).map(([emoji]) => (
                                    <span key={emoji} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border ${userReacted(msg, emoji) ? 'bg-primary/20 border-primary/40 text-primary-foreground' : 'bg-card border-border text-card-foreground'}`}>{emoji} {reactionCount(msg, emoji)}</span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                <span className="text-[10px] leading-none opacity-70">{formatMsgTime(msg.createdAt)}</span>
                                {isMe && (
                                  msg.status === 'sending' ? <Loader2 size={10} className="animate-spin text-muted-foreground" />
                                    : msg.status === 'read' ? <CheckCheck size={12} className="text-blue-400 -mr-0.5" />
                                    : <CheckCheck size={12} className="text-foreground/50 -mr-0.5" />
                                )}
                              </div>
                            </div>
                            <div className={`flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                              <button onClick={() => handleReply(msg)} className="p-1 rounded-full hover:bg-muted/40 text-muted-foreground" title="Reply"><Reply size={12} /></button>
                              <button onClick={() => { setShowEmoji(true); handleReact(msg); }} className="p-1 rounded-full hover:bg-muted/40 text-muted-foreground" title="React"><Smile size={12} /></button>
                              {isMe && <button onClick={() => handleEdit(msg)} className="p-1 rounded-full hover:bg-muted/40 text-muted-foreground" title="Edit"><Pencil size={12} /></button>}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    );
                  }} />
                )}
                <div ref={bottomRef} />
              </div>

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="px-4 py-1.5 text-xs text-muted-foreground border-t border-border/50 shrink-0">
                  {Array.from(typingUsers).map((id) => {
                    const user = activeConv?.members?.find((m) => m.userId === id);
                    return user ? `${user.user.profile?.displayName} is typing…` : 'Someone is typing…';
                  }).join(', ')}
                </div>
              )}

              {/* Pending Attachments */}
              {pendingAttachments.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 border-t border-border/50 shrink-0">
                  {pendingAttachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 text-xs">
                      {att.type === 'image' ? <ImageIcon size={14} /> : att.type === 'voice' ? <AudioLines size={14} /> : <FileText size={14} />}
                      <span className="truncate max-w-[100px]">{att.name}</span>
                      <button onClick={() => setPendingAttachments((prev) => prev.filter((_, j) => j !== i))} className="ml-1 text-muted-foreground hover:text-foreground"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Editing Banner */}
              {editingMsgId && (
                <div className="flex items-center gap-2 px-4 py-1.5 border-t border-border/50 bg-primary/5 shrink-0">
                  <Pencil size={14} className="text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground flex-1">Editing message</p>
                  <button onClick={() => { setEditingMsgId(null); setText(''); }} className="text-xs text-primary hover:underline">Cancel</button>
                </div>
              )}

              {/* Input Area */}
              <form onSubmit={editingMsgId ? (e) => { e.preventDefault(); handleEditSubmit(); } : handleSend} className="flex items-center gap-2 px-3 py-2.5 border-t border-border shrink-0">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.zip" />
                <div className="relative">
                  <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-2 rounded-full hover:bg-muted/30 shrink-0" title="Emoji"><Smile size={20} className="text-muted-foreground" /></button>
                  {showEmoji && <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="p-2 rounded-full hover:bg-muted/30 disabled:opacity-50 shrink-0" title="Attach">
                  {uploading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : <Paperclip size={20} className="text-muted-foreground" />}
                </button>
                <input value={text} onChange={handleTyping} onKeyDown={handleKeyDown} placeholder={editingMsgId ? 'Edit message…' : 'Type a message…'} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50" />
                <button type="submit" disabled={(!text.trim() && pendingAttachments.length === 0) || sending} className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0">
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          isOwn={contextMenu.msg.senderId === userId}
          onClose={() => setContextMenu(null)}
          onReply={() => handleReply(contextMenu.msg)}
          onEdit={() => handleEdit(contextMenu.msg)}
          onDelete={() => { handleDelete(contextMenu.msg); setContextMenu(null); }}
          onReact={() => { handleReact(contextMenu.msg); setContextMenu(null); }}
        />
      )}

      {/* Image Preview */}
      {previewImg && <ImagePreviewModal url={previewImg.url} name={previewImg.name} onClose={() => setPreviewImg(null)} />}

      
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading messages…</div>}>
      <ChatInner />
    </Suspense>
  );
}
