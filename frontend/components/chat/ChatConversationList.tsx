'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/lib/avatar';
import { api } from '@/lib/api';
import { formatTime, partnerName, partnerUserId, partnerAvatarUrl, lastMsg } from '@/lib/chat-utils';
import type { Conversation, SearchResult } from '@/lib/chat-types';
import { MessageSquare, Search, Plus, X, Loader2, Trash2, Users } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { useChatSetting } from '@/hooks/useChatSettings';

interface ChatConversationListProps {
  conversations: Conversation[];
  convId: string | null;
  onlineUsers: Set<string>;
  convLoading: boolean;
  token: string | null;
  userId: string | undefined;
  fetchConversations: () => void;
  onDeleteConversation: (id: string) => void;
  onConversationCreated: (conv: Conversation) => void;
}

export function ChatConversationList({
  conversations,
  convId,
  onlineUsers,
  convLoading,
  token,
  userId,
  fetchConversations,
  onDeleteConversation,
  onConversationCreated,
}: ChatConversationListProps) {
  const router = useRouter();

  // Search users
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Group creation
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [addMemberQuery, setAddMemberQuery] = useState('');
  const [addMemberResults, setAddMemberResults] = useState<SearchResult[]>([]);

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

  const whoCanMessage = useChatSetting('whoCanMessage');

  const startChat = useCallback(async (targetUserId: string) => {
    if (!token) return;
    // Enforce whoCanMessage privacy setting
    if (whoCanMessage === 'nobody') {
      sonnerToast.error('Your privacy settings prevent starting new conversations');
      return;
    }
    if (whoCanMessage === 'matches') {
      sonnerToast.info('You can only message your matches. Find matches on the Discover page.');
      return;
    }
    try {
      const conv = await api.post<Conversation>('/chat/conversations', { targetUserId }, token);
      onConversationCreated(conv);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      router.push(`/chat?conv=${conv.id}`);
    } catch {}
  }, [token, whoCanMessage, router, onConversationCreated]);

  const handleCreateGroupSearch = useCallback((q: string) => {
    setAddMemberQuery(q);
    if (!token) return;
    if (q.length < 2) { setAddMemberResults([]); return; }
    api.get<SearchResult[]>(`/users/search?q=${encodeURIComponent(q)}`, token)
      .then((users) => {
        const already = new Set(selectedMemberIds);
        setAddMemberResults(users.filter((u) => u.id !== userId && !already.has(u.id)));
      })
      .catch(() => setAddMemberResults([]));
  }, [token, userId, selectedMemberIds]);

  const handleCreateGroupMemberSelect = useCallback((uid: string) => {
    setSelectedMemberIds((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  }, []);

  const createGroup = useCallback(async () => {
    if (!token || !groupName.trim() || selectedMemberIds.length === 0) return;
    setCreatingGroup(true);
    try {
      const conv = await api.post<Conversation>('/chat/conversations/group', { name: groupName.trim(), memberIds: selectedMemberIds }, token);
      onConversationCreated(conv);
      setShowCreateGroup(false);
      setGroupName('');
      setSelectedMemberIds([]);
      setAddMemberQuery('');
      setAddMemberResults([]);
      router.push(`/chat?conv=${conv.id}`);
    } catch {}
    setCreatingGroup(false);
  }, [token, groupName, selectedMemberIds, router, onConversationCreated]);

  // Close create group panel when search is toggled off
  useEffect(() => { if (!showSearch) { setShowCreateGroup(false); } }, [showSearch]);

  return (
    <div className="w-80 shrink-0 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight">Messages</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setShowSearch(!showSearch)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="New chat">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Search Panel */}
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
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Users size={14} /> Create Group
          </button>
          {searching && <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin text-muted-foreground" /></div>}
          {searchResults.map((u) => (
            <button
              key={u.id}
              onClick={() => startChat(u.id)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
            >
              <Avatar src={u.profile?.avatarUrl} name={u.profile?.displayName ?? '?'} size="sm" />
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

      {/* Create Group Panel */}
      {showCreateGroup && (
        <div className="mb-3 rounded-lg border border-border bg-card shadow-xl p-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-1 mb-2">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <button onClick={() => { setShowCreateGroup(false); setGroupName(''); setSelectedMemberIds([]); setAddMemberQuery(''); setAddMemberResults([]); }} className="p-1 hover:bg-muted rounded"><X size={14} /></button>
          </div>
          <div className="flex items-center gap-1 mb-2">
            <input
              value={addMemberQuery}
              onChange={(e) => handleCreateGroupSearch(e.target.value)}
              placeholder="Search users to add..."
              className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {addMemberResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
              {addMemberResults.map((u) => (
                <label key={u.id} className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50 transition-colors text-left cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(u.id)}
                    onChange={() => handleCreateGroupMemberSelect(u.id)}
                    className="rounded border-input text-primary focus:ring-primary/20"
                  />
                  <Avatar src={u.profile?.avatarUrl} name={u.profile?.displayName ?? '?'} size="xs" />
                  <span className="truncate flex-1">{u.profile?.displayName ?? 'User'}</span>
                </label>
              ))}
            </div>
          )}
          {addMemberQuery.length >= 2 && addMemberResults.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-2 mb-2">No users found</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <p className="text-xs text-muted-foreground">{selectedMemberIds.length} selected</p>
            <button
              onClick={createGroup}
              disabled={creatingGroup || !groupName.trim() || selectedMemberIds.length === 0}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {creatingGroup ? <Loader2 size={12} className="animate-spin" /> : <>Create Group</>}
            </button>
          </div>
        </div>
      )}

      {/* Conversation List */}
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
            <button
              onClick={() => setShowSearch(true)}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus size={16} /> Start Chat
            </button>
          </div>
        )}
        {conversations.length > 0 && (
          <div className="h-full overflow-y-auto">
            {conversations.map((c) => {
              const pUid = partnerUserId(c, userId);
              const isOnline = pUid ? onlineUsers.has(pUid) : false;
              return (
                <div key={c.id} className="group relative">
                  <button
                    onClick={() => router.push(`/chat?conv=${c.id}`)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left rounded-lg ${c.id === convId ? 'bg-muted' : 'hover:bg-muted/50'}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar src={partnerAvatarUrl(c, userId)} name={partnerName(c, userId)} size="lg" />
                      {isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-card" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-medium text-sm">{partnerName(c, userId)}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground ml-2">{c.messages?.[0]?.createdAt ? formatTime(c.messages[0].createdAt) : ''}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground mt-0.5">{lastMsg(c)}</p>
                    </div>
                  </button>
                  {c.id === convId && (
                    <button
                      onClick={() => onDeleteConversation(c.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground hover:text-danger hover:bg-muted/30 opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
