'use client';

import { useEffect, useRef, useState } from 'react';
import { Pencil, Reply, Smile, Trash2, X, ChevronDown } from 'lucide-react';

// ──────────────────────────────────────────────
// EMOJI_CATEGORIES
// ──────────────────────────────────────────────

export const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  { name: 'Smileys', emojis: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤩', '😜', '🤗', '😇', '🙃', '🤔', '🤨', '😐', '😏', '😒', '😬', '😢', '😭', '😤', '😡', '🥺', '😴', '🤤', '😵', '🤯'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞', '🫶', '👋', '🤙', '👌', '✋', '💅', '🙏', '🤲'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❤️‍🔥', '💖', '💗', '💝', '💘', '💕', '💞'] },
  { name: 'Objects', emojis: ['🔥', '⭐', '⚡', '💯', '🎉', '🎊', '✨', '🎯', '🏆', '💡', '📌', '🔔', '📢', '💎', '🧠', '👀'] },
];

// ──────────────────────────────────────────────
// ImagePreviewModal
// ──────────────────────────────────────────────

interface ImagePreviewModalProps {
  url: string;
  name: string;
  onClose: () => void;
}

export function ImagePreviewModal({ url, name, onClose }: ImagePreviewModalProps) {
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

// ──────────────────────────────────────────────
// ChatContextMenu
// ──────────────────────────────────────────────

interface ContextMenuProps {
  x: number;
  y: number;
  isOwn: boolean;
  onClose: () => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: () => void;
}

export function ChatContextMenu({ x, y, isOwn, onClose, onReply, onEdit, onDelete, onReact }: ContextMenuProps) {
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
      {isOwn && (
        <>
          <button onClick={() => { onEdit(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 text-left"><Pencil size={15} /> Edit</button>
          <button onClick={() => { onReply(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 text-left"><Reply size={15} /> Reply</button>
        </>
      )}
      {!isOwn && (
        <button onClick={() => { onReply(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 text-left"><Reply size={15} /> Reply</button>
      )}
      <button onClick={() => { onReact(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 text-left"><Smile size={15} /> React</button>
      {isOwn && (
        <button onClick={() => { onDelete(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 text-left text-danger"><Trash2 size={15} /> Delete</button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// EmojiPicker
// ──────────────────────────────────────────────

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
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
          <button
            key={c.name}
            onClick={() => setCat(i)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${i === cat ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {c.name}
          </button>
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

// ──────────────────────────────────────────────
// ScrollToBottomBtn
// ──────────────────────────────────────────────

interface ScrollToBottomBtnProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToBottomBtn({ visible, onClick }: ScrollToBottomBtnProps) {
  if (!visible) return null;
  return (
    <button onClick={onClick} className="absolute bottom-4 right-6 z-20 p-2 rounded-full bg-card border border-border shadow-lg hover:bg-muted/50 transition-all animate-in fade-in">
      <ChevronDown size={18} className="text-muted-foreground" />
    </button>
  );
}
