'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/lib/avatar';
import { api } from '@/lib/api';
import { formatTime, partnerName, partnerUserId, partnerAvatarUrl, lastMsg } from '@/lib/chat-utils';
import type { Conversation, SearchResult } from '@/lib/chat-types';
import { MessageSquare, Search, Plus, X, Loader2, Trash2, Users, Check } from 'lucide-react';
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
  const [selectedMembers, setSelectedMembers] = useState<{ userId: string; displayName: string; avatarUrl?: string | null }[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [addMemberQuery, setAddMemberQuery] = useState('');
  const [addMemberResults, setAddMemberResults] = useState<SearchResult[]>([]);
  const [groupSearching, setGroupSearching] = useState(false);

  const searchUsers = useCallback(async (q: string): Promise<SearchResult[]> => {
    if (!token) return [];
    const data = await api.get<{ hits: SearchResult[]; total: number }>(`/users/search?q=${encodeURIComponent(q)}&limit=50`, token);
    return data?.hits ?? [];
  }, [token]);

  // Load all developers for the new-chat search panel when it opens
  useEffect(() => {
    if (!showSearch || showCreateGroup) return;
    setSearching(true);
    searchUsers('')
      .then((users) => setSearchResults(users.filter((u) => u.userId !== userId)))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [showSearch, showCreateGroup, userId, searchUsers]);

  // Load all developers for the create-group panel when it opens
  useEffect(() => {
    if (!showCreateGroup) return;
    setGroupSearching(true);
    searchUsers('')
      .then((users) => {
        const already = new Set(selectedMembers.map((m) => m.userId));
        setAddMemberResults(users.filter((u) => u.userId !== userId && !already.has(u.userId)));
      })
      .catch(() => setAddMemberResults([]))
      .finally(() => setGroupSearching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateGroup, userId, searchUsers]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 2) {
      // fall back to the preloaded developer list
      setSearching(true);
      searchUsers('')
        .then((users) => setSearchResults(users.filter((u) => u.userId !== userId)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
      return;
    }
    setSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query)
        .then((users) => setSearchResults(users.filter((u) => u.userId !== userId)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
  }, [searchUsers, userId]);

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
    setGroupSearching(true);
    const already = new Set(selectedMembers.map((m) => m.userId));
    searchUsers(q.length >= 2 ? q : '')
      .then((users) => setAddMemberResults(users.filter((u) => u.userId !== userId && !already.has(u.userId))))
      .catch(() => setAddMemberResults([]))
      .finally(() => setGroupSearching(false));
  }, [token, userId, selectedMembers, searchUsers]);

  const handleCreateGroupMemberSelect = useCallback((u: SearchResult) => {
    setSelectedMembers((prev) => {
      if (prev.some((m) => m.userId === u.userId)) return prev.filter((m) => m.userId !== u.userId);
      return [...prev, { userId: u.userId, displayName: u.displayName || 'Developer', avatarUrl: u.avatarUrl }];
    });
  }, []);

  const createGroup = useCallback(async () => {
    if (!token || selectedMembers.length === 0) return;
    setCreatingGroup(true);
    try {
      const fallbackName = selectedMembers.map((m) => m.displayName).join(', ');
      const conv = await api.post<Conversation>('/chat/conversations/group', { name: groupName.trim() || fallbackName, memberIds: selectedMembers.map((m) => m.userId) }, token);
      onConversationCreated(conv);
      setShowCreateGroup(false);
      setGroupName('');
      setSelectedMembers([]);
      setAddMemberQuery('');
      setAddMemberResults([]);
      router.push(`/chat?conv=${conv.id}`);
    } catch {}
    setCreatingGroup(false);
  }, [token, groupName, selectedMembers, router, onConversationCreated]);

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
              key={u.userId}
              onClick={() => startChat(u.userId)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
            >
              <Avatar src={u.avatarUrl} name={u.displayName ?? '?'} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{u.displayName ?? 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{u.headline ?? 'Developer'}</p>
              </div>
            </button>
          ))}
          {!searching && searchResults.length === 0 && (
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
            <button onClick={() => { setShowCreateGroup(false); setGroupName(''); setSelectedMembers([]); setAddMemberQuery(''); setAddMemberResults([]); }} className="p-1 hover:bg-muted rounded"><X size={14} /></button>
          </div>
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedMembers.map((m) => (
                <span key={m.userId} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[11px] px-2 py-0.5">
                  {m.displayName}
                  <button onClick={() => handleCreateGroupMemberSelect({ userId: m.userId, displayName: m.displayName, avatarUrl: m.avatarUrl } as SearchResult)} className="hover:text-primary/70">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 mb-2">
            <input
              value={addMemberQuery}
              onChange={(e) => handleCreateGroupSearch(e.target.value)}
              placeholder="Search users to add..."
              className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          {groupSearching && <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin text-muted-foreground" /></div>}
          {addMemberResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
              {addMemberResults.map((u) => (
                <label key={u.userId} className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50 transition-colors text-left cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMembers.some((m) => m.userId === u.userId)}
                    onChange={() => handleCreateGroupMemberSelect(u)}
                    className="rounded border-input text-primary focus:ring-primary/20"
                  />
                  <Avatar src={u.avatarUrl} name={u.displayName ?? '?'} size="xs" />
                  <span className="truncate flex-1">{u.displayName ?? 'User'}</span>
                  {u.headline && <span className="truncate max-w-24 text-[10px] text-muted-foreground">{u.headline}</span>}
                </label>
              ))}
            </div>
          )}
          {!groupSearching && addMemberResults.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-2 mb-2">No users found</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <p className="text-xs text-muted-foreground">{selectedMembers.length} selected</p>
            <button
              onClick={createGroup}
              disabled={creatingGroup || selectedMembers.length === 0}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {creatingGroup ? <Loader2 size={12} className="animate-spin" /> : <><Check size={12} className="inline mr-1" />Create Group</>}
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
                      {!c.isGroup && pUid && onlineUsers.has(pUid) && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-card" />}
                      {c.isGroup && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-card flex items-center justify-center">
                          <Users size={6} className="text-primary-foreground" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-medium text-sm">{partnerName(c, userId)}</p>
                        <span className="shrink-0 text-[11px] text-muted-foreground ml-2">{c.messages?.[0]?.createdAt ? formatTime(c.messages[0].createdAt) : ''}</span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground mt-0.5">{c.isGroup ? `${c.members.length} members` : lastMsg(c)}</p>
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
