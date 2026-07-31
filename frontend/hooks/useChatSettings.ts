'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'devconnect-chat-settings';

export interface ChatSettings {
  messageSound: boolean;
  preview: boolean;
  typingIndicators: boolean;
  readReceipts: boolean;
  enterToSend: boolean;
  bubbleStyle: 'rounded' | 'compact' | 'modern';
  fontSize: 'sm' | 'md' | 'lg';
  onlineVisibility: 'everyone' | 'matches' | 'nobody';
  whoCanMessage: 'everyone' | 'matches' | 'nobody';
  autoDownloadImages: boolean;
  videoAutoplay: boolean;
}

const DEFAULT_SETTINGS: ChatSettings = {
  messageSound: true,
  preview: true,
  typingIndicators: true,
  readReceipts: true,
  enterToSend: true,
  bubbleStyle: 'rounded',
  fontSize: 'md',
  onlineVisibility: 'everyone',
  whoCanMessage: 'everyone',
  autoDownloadImages: false,
  videoAutoplay: false,
};

function loadSettings(): ChatSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function useChatSettings(): ChatSettings {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());

    // Sync across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSettings(loadSettings());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return settings;
}

/**
 * Convenience hook that returns individual chat settings values.
 * Use this when you need a specific setting value in a component.
 */
export function useChatSetting<K extends keyof ChatSettings>(key: K): ChatSettings[K] {
  const settings = useChatSettings();
  return settings[key];
}

/**
 * Returns CSS classes for the selected bubble style.
 */
export function getBubbleClasses(style: ChatSettings['bubbleStyle'], isMe: boolean): string {
  switch (style) {
    case 'compact':
      return isMe
        ? 'bg-primary text-primary-foreground rounded-xl rounded-br-sm px-2.5 py-1.5'
        : 'bg-card text-card-foreground rounded-xl rounded-bl-sm shadow-sm border border-border/30 px-2.5 py-1.5';
    case 'modern':
      return isMe
        ? 'bg-primary text-primary-foreground rounded-none rounded-tl-lg px-4 py-2.5 border-r-4 border-r-primary-foreground/30'
        : 'bg-card text-card-foreground rounded-none rounded-tr-lg shadow-sm border border-border/30 px-4 py-2.5 border-l-4 border-l-primary/30';
    case 'rounded':
    default:
      return isMe
        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3 py-2'
        : 'bg-card text-card-foreground rounded-2xl rounded-bl-sm shadow-sm border border-border/30 px-3 py-2';
  }
}

/**
 * Returns a Tailwind text-size class for the selected font size.
 */
export function getFontSizeClass(size: ChatSettings['fontSize']): string {
  switch (size) {
    case 'sm': return 'text-xs';
    case 'lg': return 'text-base';
    case 'md':
    default: return 'text-sm';
  }
}

export { DEFAULT_SETTINGS };
