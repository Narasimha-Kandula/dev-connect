'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Loader2, Paperclip, Smile, Mic, CheckCheck, X, Pencil, AudioLines, FileText, ImageIcon } from 'lucide-react';
import { EmojiPicker } from '@/components/chat/primitives';
import { useChatSetting } from '@/hooks/useChatSettings';
import type { ChatMessage } from '@/lib/chat-types';

interface ChatInputBarProps {
  text: string;
  onTextChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmojiSelect: (emoji: string) => void;
  onSend: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  sending: boolean;
  editingMsgId: string | null;
  pendingAttachments: { url: string; type: string; name: string }[];
  uploading: boolean;
  onCancelEdit: () => void;
  onRemoveAttachment: (index: number) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  recording: boolean;
  onEditSubmit: () => void;
}

export function ChatInputBar({
  text,
  onTextChange,
  onEmojiSelect,
  onSend,
  onKeyDown,
  sending,
  editingMsgId,
  pendingAttachments,
  uploading,
  onCancelEdit,
  onRemoveAttachment,
  onFileUpload,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  recording,
  onEditSubmit,
}: ChatInputBarProps) {
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEmojiSelect = useCallback((emoji: string) => {
    onEmojiSelect(emoji);
    setShowEmoji(false);
  }, [onEmojiSelect]);

  const enterToSend = useChatSetting('enterToSend');

  const submitHandler = editingMsgId ? (e: React.FormEvent) => { e.preventDefault(); onEditSubmit(); } : onSend;

  return (
    <>
      {/* Pending Attachments */}
      {pendingAttachments.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-border/50 shrink-0">
          {pendingAttachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 text-xs">
              {att.type === 'image' ? <ImageIcon size={14} /> : att.type === 'voice' ? <AudioLines size={14} /> : <FileText size={14} />}
              <span className="truncate max-w-[100px]">{att.name}</span>
              <button onClick={() => onRemoveAttachment(i)} className="ml-1 text-muted-foreground hover:text-foreground"><X size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Editing Banner */}
      {editingMsgId && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-t border-border/50 bg-primary/5 shrink-0">
          <Pencil size={14} className="text-primary shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">Editing message</p>
          <button onClick={onCancelEdit} className="text-xs text-primary hover:underline">Cancel</button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={submitHandler} className="flex items-center gap-2 px-3 py-2.5 border-t border-border shrink-0">
        <input type="file" ref={fileInputRef} onChange={onFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.zip" />

        {/* Emoji Button */}
        <div className="relative">
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-2 rounded-full hover:bg-muted/30 shrink-0" title="Emoji">
            <Smile size={20} className="text-muted-foreground" />
          </button>
          {showEmoji && <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />}
        </div>

        {/* Attach Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 rounded-full hover:bg-muted/30 disabled:opacity-50 shrink-0"
          title="Attach"
        >
          {uploading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : <Paperclip size={20} className="text-muted-foreground" />}
        </button>

        {/* Voice Recording */}
        {recording ? (
          <div className="flex items-center gap-2 px-2 rounded-full bg-red-500/10 text-red-500 animate-pulse">
            <Mic size={16} />
            <span className="text-xs font-medium">Recording...</span>
            <button type="button" onClick={onStopRecording} className="p-1 rounded-full hover:bg-red-500/20" title="Send voice message">
              <CheckCheck size={14} />
            </button>
            <button type="button" onClick={onCancelRecording} className="p-1 rounded-full hover:bg-red-500/20" title="Cancel">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartRecording}
            disabled={uploading || text.trim().length > 0}
            className="p-2 rounded-full hover:bg-muted/30 disabled:opacity-50 shrink-0"
            title="Voice message"
          >
            <Mic size={20} className="text-muted-foreground" />
          </button>
        )}

        {/* Text Input */}
        <input
          value={text}
          onChange={onTextChange}
          onKeyDown={enterToSend ? onKeyDown : undefined}
          placeholder={editingMsgId ? 'Edit message…' : 'Type a message…'}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          aria-label="Message input"
        />

        {/* Send / Edit Submit */}
        <button
          type="submit"
          disabled={(!text.trim() && pendingAttachments.length === 0) || sending}
          className="p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </>
  );
}
