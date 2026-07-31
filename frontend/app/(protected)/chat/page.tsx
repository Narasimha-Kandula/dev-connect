'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useChatSocket } from '@/hooks/useChatSocket';
import { MessageSquare } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import type { Conversation, ChatMessage, SearchResult } from '@/lib/chat-types';
import { partnerName, partnerUserId, partnerAvatarUrl } from '@/lib/chat-utils';
import { ChatConversationList } from '@/components/chat/ChatConversationList';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { ChatContextMenu, ImagePreviewModal } from '@/components/chat/primitives';

function ChatInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const convId = searchParams.get('conv');
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);

  // Conversation list
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Message input state
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<{ url: string; type: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const cancelRecordingRef = useRef(false);

  // Overlays
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: ChatMessage } | null>(null);
  const [previewImg, setPreviewImg] = useState<{ url: string; name: string } | null>(null);

  // Message search
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [msgSearchResults, setMsgSearchResults] = useState<number[]>([]);
  const [msgSearchIdx, setMsgSearchIdx] = useState(0);
  const [showMsgSearch, setShowMsgSearch] = useState(false);

  // Add members
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

  const activeConv = conversations.find((c) => c.id === convId);
  const activeOtherUserId = activeConv ? partnerUserId(activeConv, userId) : undefined;

  // ─── Fetch conversations ───
  const fetchConversations = useCallback(() => {
    if (!token) return;
    setConvLoading(true);
    api.get<Conversation[]>('/chat/conversations', token)
      .then(setConversations)
      .catch(() => {})
      .finally(() => setConvLoading(false));
  }, [token]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // ─── Fetch messages for selected conversation ───
  useEffect(() => {
    if (!token || !convId) return;
    setLoading(true);
    api.get<ChatMessage[]>(`/chat/conversations/${convId}/messages`, token)
      .then((msgs) => { setInitialMessages(msgs.reverse()); setLoading(false); })
      .catch(() => { setInitialMessages([]); setLoading(false); });
  }, [convId, token, setInitialMessages]);

  // ─── Add member search ───
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

  // ─── Messages: send / typing ───
  const handleSend = useCallback((e: React.FormEvent) => {
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

  const handleEmojiSelect = useCallback((emoji: string) => {
    setText((prev) => prev + emoji);
  }, []);

  // ─── Messages: edit / reply / react / delete ───
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

  const handleCancelEdit = useCallback(() => {
    setEditingMsgId(null);
    setText('');
  }, []);

  const handleDelete = useCallback((msg: ChatMessage) => {
    if (editingMsgId) return;
    deleteMessage(msg.id);
    sonnerToast.success('Message deleted');
  }, [editingMsgId, deleteMessage]);

  const handleReact = useCallback((msg: ChatMessage) => {
    addReaction(msg.id, '👍');
  }, [addReaction]);

  const handleContextMenu = useCallback((e: React.MouseEvent, msg: ChatMessage) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  }, []);

  // ─── Conversation management ───
  const deleteConversation = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await api.delete(`/chat/conversations/${id}`, token);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (convId === id) router.push('/chat');
    } catch {}
  }, [token, convId, router]);

  const handleConversationCreated = useCallback((conv: Conversation) => {
    setConversations((prev) => {
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
  }, []);

  // ─── Voice recording ───
  const startRecording = useCallback(async () => {
    if (!convId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      cancelRecordingRef.current = false;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (cancelRecordingRef.current) { cancelRecordingRef.current = false; return; }
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        if (blob.size === 0 || !token || !convId) return;
        setUploading(true);
        try {
          const form = new FormData();
          form.append('file', blob, `voice-${Date.now()}.webm`);
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/upload`,
            { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
          );
          const data = await res.json();
          if (data.url) {
            sendMessage('', [{ url: data.url, type: 'voice', name: `voice-${Date.now()}.webm` }]);
          }
        } catch { sonnerToast.error('Failed to send voice message'); }
        setUploading(false);
      };
      recorder.start();
      setRecording(true);
    } catch {
      sonnerToast.error('Microphone access denied');
    }
  }, [token, convId, sendMessage]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      cancelRecordingRef.current = false;
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, [recording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      cancelRecordingRef.current = true;
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, [recording]);

  // ─── File upload ───
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/upload`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
      );
      const data = await res.json();
      if (data.url) {
        const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'voice' : 'file';
        setPendingAttachments((prev) => [...prev, { url: data.url, type, name: file.name }]);
      }
    } catch { sonnerToast.error('Upload failed'); }
    setUploading(false);
  }, [token]);

  // ─── Message search ───
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

  return (
    <div className="mx-auto flex max-w-6xl h-[calc(100vh-4rem)] px-4 py-4">
      <div className="flex flex-1 gap-4 h-full">
        {/* Sidebar */}
        <div className={convId ? 'hidden lg:block h-full' : 'block h-full'}>
          <ChatConversationList
            conversations={conversations}
            convId={convId}
            onlineUsers={onlineUsers}
            convLoading={convLoading}
            token={token}
            userId={userId}
            fetchConversations={fetchConversations}
            onDeleteConversation={deleteConversation}
            onConversationCreated={handleConversationCreated}
          />
        </div>

        {/* Chat Area */}
        <div className={`flex flex-1 flex-col ${!convId ? 'hidden lg:flex' : 'flex'}`}>
          {!convId ? (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-card text-center text-sm text-muted-foreground">
              <div className="space-y-2">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p>Choose a conversation from the sidebar</p>
                <p className="text-xs">Or start a new one by clicking +</p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages (includes its own header with lg:hidden back button) */}
              <ChatMessageList
                messages={messages}
                loading={loading}
                userId={userId}
                activeConv={activeConv}
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
                replyingTo={replyingTo}
                editingMsgId={editingMsgId}
                isConnected={isConnected}
                onReply={handleReply}
                onEdit={handleEdit}
                onReact={handleReact}
                onContextMenu={handleContextMenu}
                onPreviewImage={(url, name) => setPreviewImg({ url, name })}
                onBackToConversations={() => router.push('/chat')}
                // Message search
                msgSearchQuery={msgSearchQuery}
                msgSearchResults={msgSearchResults}
                msgSearchIdx={msgSearchIdx}
                onMsgSearchQueryChange={handleMsgSearch}
                onGoToMsgSearchResult={goToMsgSearchResult}
                onMsgSearchClose={() => { setShowMsgSearch(false); setMsgSearchQuery(''); setMsgSearchResults([]); }}
                showMsgSearch={showMsgSearch}
                onToggleMsgSearch={() => setShowMsgSearch(!showMsgSearch)}
                // Add members
                showAddMembers={showAddMembers}
                onToggleAddMembers={() => setShowAddMembers(!showAddMembers)}
                addMemberQuery={addMemberQuery}
                addMemberResults={addMemberResults}
                addingMember={addingMember}
                onAddMemberSearch={handleAddMemberSearch}
                onAddMember={handleAddMembers}
                onCloseAddMembers={() => { setShowAddMembers(false); setAddMemberQuery(''); setAddMemberResults([]); }}
              />

              {/* Input Bar */}
              <ChatInputBar
                text={text}
                onTextChange={handleTyping}
                onEmojiSelect={handleEmojiSelect}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                sending={sending}
                editingMsgId={editingMsgId}
                pendingAttachments={pendingAttachments}
                uploading={uploading}
                onCancelEdit={handleCancelEdit}
                onRemoveAttachment={(i) => setPendingAttachments((prev) => prev.filter((_, j) => j !== i))}
                onFileUpload={handleFileUpload}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onCancelRecording={cancelRecording}
                recording={recording}
                onEditSubmit={handleEditSubmit}
              />
            </>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ChatContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isOwn={contextMenu.msg.senderId === userId}
          onClose={() => setContextMenu(null)}
          onReply={() => handleReply(contextMenu.msg)}
          onEdit={() => handleEdit(contextMenu.msg)}
          onDelete={() => { handleDelete(contextMenu.msg); setContextMenu(null); }}
          onReact={() => { handleReact(contextMenu.msg); setContextMenu(null); }}
        />
      )}

      {/* Image Preview */}
      {previewImg && (
        <ImagePreviewModal url={previewImg.url} name={previewImg.name} onClose={() => setPreviewImg(null)} />
      )}
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
