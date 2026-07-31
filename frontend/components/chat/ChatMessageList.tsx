'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/lib/avatar';
import { formatMsgTime, formatDateSeparator, shouldShowDateSeparator, partnerName, partnerUserId, partnerAvatarUrl } from '@/lib/chat-utils';
import type { ChatMessage, Conversation } from '@/lib/chat-types';
import { ScrollToBottomBtn } from '@/components/chat/primitives';
import { useChatSettings, getBubbleClasses, getFontSizeClass } from '@/hooks/useChatSettings';
import { Loader2, Reply, Smile, Pencil, FileText, AudioLines, CheckCheck, X, Search, Users, Plus, ChevronLeft, ChevronDown } from 'lucide-react';

interface ChatMessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  userId: string | undefined;
  activeConv: Conversation | undefined;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  replyingTo: ChatMessage | null;
  editingMsgId: string | null;
  isConnected: boolean;
  onReply: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onReact: (msg: ChatMessage) => void;
  onContextMenu: (e: React.MouseEvent, msg: ChatMessage) => void;
  onPreviewImage: (url: string, name: string) => void;
  // Message search
  msgSearchQuery: string;
  msgSearchResults: number[];
  msgSearchIdx: number;
  onMsgSearchQueryChange: (q: string) => void;
  onGoToMsgSearchResult: (dir: 'prev' | 'next') => void;
  onMsgSearchClose: () => void;
  showMsgSearch: boolean;
  onToggleMsgSearch: () => void;
  // Add members
  showAddMembers: boolean;
  onToggleAddMembers: () => void;
  addMemberQuery: string;
  addMemberResults: { id: string; profile?: { displayName: string; avatarUrl?: string } }[];
  addingMember: boolean;
  onAddMemberSearch: (q: string) => void;
  onAddMember: (memberId: string) => void;
  onCloseAddMembers: () => void;
  onBackToConversations: () => void;
}

export function ChatMessageList({
  onBackToConversations,
  messages,
  loading,
  userId,
  activeConv,
  onlineUsers,
  typingUsers,
  replyingTo,
  editingMsgId,
  isConnected,
  onReply,
  onEdit,
  onReact,
  onContextMenu,
  onPreviewImage,
  msgSearchQuery,
  msgSearchResults,
  msgSearchIdx,
  onMsgSearchQueryChange,
  onGoToMsgSearchResult,
  onMsgSearchClose,
  showMsgSearch,
  onToggleMsgSearch,
  showAddMembers,
  onToggleAddMembers,
  addMemberQuery,
  addMemberResults,
  addingMember,
  onAddMemberSearch,
  onAddMember,
  onCloseAddMembers,
}: ChatMessageListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsScrolledUp(dist > 150);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isScrolledUp) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isScrolledUp]);

  const userReacted = (msg: ChatMessage, emoji: string) =>
    msg.reactions?.some((r) => r.emoji === emoji && r.userId === userId) ?? false;

  const reactionCount = (msg: ChatMessage, emoji: string) =>
    msg.reactions?.filter((r) => r.emoji === emoji).length ?? 0;

  const settings = useChatSettings();
  const activeOtherUserId = activeConv ? partnerUserId(activeConv, userId) : undefined;

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      {activeConv && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 shrink-0">
          <button onClick={onBackToConversations} className="lg:hidden p-1.5 hover:bg-muted rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <div className="relative shrink-0">
            <Avatar src={partnerAvatarUrl(activeConv, userId)} name={partnerName(activeConv, userId)} size="lg" />
            {activeOtherUserId && onlineUsers.has(activeOtherUserId) && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-card" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold">{partnerName(activeConv, userId)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {activeOtherUserId && onlineUsers.has(activeOtherUserId) ? 'Online' : isConnected ? 'Offline' : 'Connecting...'}
            </p>
          </div>
          <button
            onClick={() => { onCloseAddMembers(); onToggleMsgSearch(); }}
            className="p-1.5 rounded-full hover:bg-muted/30 text-muted-foreground"
            title="Search in conversation"
          >
            <Search size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => { onToggleAddMembers(); }}
              className="p-1.5 rounded-full hover:bg-muted/30 text-muted-foreground"
              title="Add members"
            >
              <Users size={16} />
            </button>
            {showAddMembers && (
              <div className="absolute right-0 top-10 z-30 w-64 rounded-lg border border-border bg-card shadow-xl p-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-1 mb-2">
                  <input
                    value={addMemberQuery}
                    onChange={(e) => onAddMemberSearch(e.target.value)}
                    placeholder="Search users..."
                    className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                  <button onClick={onCloseAddMembers} className="p-1 hover:bg-muted rounded"><X size={14} /></button>
                </div>
                {addMemberResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {addMemberResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => onAddMember(u.id)}
                        disabled={addingMember}
                        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
                      >
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
        </div>
      )}

      {showMsgSearch && activeConv && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border/50 bg-muted/20 shrink-0">
          <input
            value={msgSearchQuery}
            onChange={(e) => onMsgSearchQueryChange(e.target.value)}
            placeholder="Search in chat..."
            className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <button onClick={() => onGoToMsgSearchResult('prev')} className="p-1 hover:bg-muted rounded" title="Previous">
            <ChevronDown size={14} className="rotate-180" />
          </button>
          <button onClick={() => onGoToMsgSearchResult('next')} className="p-1 hover:bg-muted rounded" title="Next">
            <ChevronDown size={14} />
          </button>
          <button onClick={onMsgSearchClose} className="p-1 hover:bg-muted rounded"><X size={14} /></button>
          {msgSearchResults.length > 0 && (
            <span className="text-[11px] text-muted-foreground ml-1">{msgSearchIdx + 1} of {msgSearchResults.length}</span>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 relative"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          backgroundColor: 'var(--color-background)',
        }}
        role="log"
        aria-live="polite"
        aria-label="Message list"
      >
        <ScrollToBottomBtn visible={isScrolledUp} onClick={scrollToBottom} />

        {loading && (
          <div className="flex justify-center py-10">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-sm">Loading messages…</span>
            </div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Send a message to start chatting</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === userId;
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId);
          const showDate = shouldShowDateSeparator(messages, idx);
          const isHighlighted = msgSearchResults.includes(idx) && msgSearchResults[msgSearchIdx] === idx;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 rounded-full bg-card/80 text-[11px] text-muted-foreground shadow-sm border border-border/50 backdrop-blur-sm">
                    {formatDateSeparator(msg.createdAt)}
                  </span>
                </div>
              )}
              <motion.div
                id={`msg-${msg.id}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-1.5 mb-1 ${isHighlighted ? 'bg-primary/5 -mx-4 px-4 py-1 rounded-lg' : ''}`}
                    onContextMenu={(e) => onContextMenu(e, msg)}
                  >
                    {replyingTo?.id === msg.id && (
                      <div className="absolute -top-6 left-0 right-0 px-2 py-0.5 bg-primary/10 rounded-t-lg text-[10px] text-primary">
                        <Reply size={10} className="inline mr-1" />Replying
                      </div>
                    )}
                    {!isMe && (
                      <div className="w-7 shrink-0 self-end pb-1">
                        {showAvatar ? (
                          <Avatar src={msg.sender?.profile?.avatarUrl} name={msg.sender?.profile?.displayName ?? '?'} size="xs" />
                        ) : (
                          <div className="h-7 w-7" />
                        )}
                      </div>
                    )}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] group`}>
                      <div
                        className={`relative leading-relaxed whitespace-pre-wrap break-words transition-all ${getBubbleClasses(settings.bubbleStyle, isMe)} ${getFontSizeClass(settings.fontSize)} ${editingMsgId === msg.id ? 'ring-2 ring-primary' : ''}`}
                      >
                        {msg.content && <span>{msg.content}</span>}
                        {msg.attachments?.map((att, i) => (
                          <div key={i} className={msg.content ? 'mt-1.5' : ''}>
                            {att.type === 'image' ? (
                              <button onClick={() => onPreviewImage(att.url, att.name)} className="block">
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
                        {/* Reactions */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1.5">
                            {Object.entries(
                              msg.reactions.reduce<Record<string, string[]>>((acc, r) => {
                                if (!acc[r.emoji]) acc[r.emoji] = [];
                                acc[r.emoji].push(r.userId);
                                return acc;
                              }, {})
                            ).map(([emoji]) => (
                              <span
                                key={emoji}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border ${
                                  userReacted(msg, emoji)
                                    ? 'bg-primary/20 border-primary/40 text-primary-foreground'
                                    : 'bg-card border-border text-card-foreground'
                                }`}
                              >
                                {emoji} {reactionCount(msg, emoji)}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <span className="text-[10px] leading-none opacity-70">{formatMsgTime(msg.createdAt)}</span>
                          {isMe && (
                            msg.status === 'sending' ? (
                              <Loader2 size={10} className="animate-spin text-muted-foreground" />
                            ) : msg.status === 'read' ? (
                              <CheckCheck size={12} className="text-blue-400 -mr-0.5" />
                            ) : (
                              <CheckCheck size={12} className="text-foreground/50 -mr-0.5" />
                            )
                          )}
                        </div>
                      </div>
                      {/* Hover actions */}
                      <div className={`flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                        <button onClick={() => onReply(msg)} className="p-1 rounded-full hover:bg-muted/40 text-muted-foreground" title="Reply">
                          <Reply size={12} />
                        </button>
                        <button onClick={() => onReact(msg)} className="p-1 rounded-full hover:bg-muted/40 text-muted-foreground" title="React">
                          <Smile size={12} />
                        </button>
                        {isMe && (
                          <button onClick={() => onEdit(msg)} className="p-1 rounded-full hover:bg-muted/40 text-muted-foreground" title="Edit">
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
        <div ref={bottomRef} />
      </div>

      {/* Typing Indicator */}
      {settings.typingIndicators && typingUsers.size > 0 && (
        <div className="px-4 py-1.5 text-xs text-muted-foreground border-t border-border/50 shrink-0">
          {Array.from(typingUsers).map((id) => {
            const user = activeConv?.members?.find((m) => m.userId === id);
            return user ? `${user.user.profile?.displayName} is typing…` : 'Someone is typing…';
          }).join(', ')}
        </div>
      )}
    </div>
  );
}


