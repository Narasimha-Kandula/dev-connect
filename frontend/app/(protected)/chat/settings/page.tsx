'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import {
  ArrowLeft, Bell, Eye, Ban, UserX, Palette, Monitor,
  Download, Trash2, DownloadCloud, Check, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'devconnect-chat-settings';

interface ChatSettings {
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

function Toggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg p-3 hover:bg-muted/20 transition-colors cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
      />
    </label>
  );
}

function SelectSetting({ label, description, value, options, onChange }: {
  label: string; description?: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-lg p-3 hover:bg-muted/20 transition-colors">
      <p className="text-sm font-medium">{label}</p>
      {description && <p className="text-xs text-muted-foreground mt-0.5 mb-2">{description}</p>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function ChatSettingsPage() {
  const token = useAuthStore((s) => s.token);
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage + blocked count from API
  useEffect(() => {
    setSettings(loadSettings());
    setLoaded(true);
    if (!token) return;
    api.get<unknown[]>('/users/me/blocked', token)
      .then((data) => setBlockedCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [token]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    } catch {}
  }, [settings, loaded]);

  const updateSetting = useCallback(<K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    toast.success('Settings reset to defaults');
  }, []);

  const clearingRef = useRef(false);

  const handleClearHistory = useCallback(async () => {
    if (!token || clearingRef.current) return;
    clearingRef.current = true;
    setClearingHistory(true);
    try {
      await api.delete('/chat/conversations', token);
      toast.success('Chat history cleared');
    } catch {
      toast.error('Clear history is not available yet');
    }
    clearingRef.current = false;
    setClearingHistory(false);
  }, [token]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/chat" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft size={14} /> Back to Messages
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Chat Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your messaging experience</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-success">
              <Check size={12} /> Saved
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={resetSettings} title="Reset to defaults">
            Reset
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle><Bell size={16} className="mr-1.5 inline" /> Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-0 -mt-1">
          <Toggle
            label="Message Sound"
            description="Play a sound when a new message arrives"
            checked={settings.messageSound}
            onChange={(v) => updateSetting('messageSound', v)}
          />
          <Toggle
            label="Message Preview"
            description="Show message previews in notifications"
            checked={settings.preview}
            onChange={(v) => updateSetting('preview', v)}
          />
          <Toggle
            label="Typing Indicators"
            description="Show when someone is typing a message"
            checked={settings.typingIndicators}
            onChange={(v) => updateSetting('typingIndicators', v)}
          />
          <Toggle
            label="Read Receipts"
            description="Let others know when you've read their messages"
            checked={settings.readReceipts}
            onChange={(v) => updateSetting('readReceipts', v)}
          />
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader><CardTitle><Palette size={16} className="mr-1.5 inline" /> Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SelectSetting
            label="Chat Bubble Style"
            description="Choose how messages are displayed"
            value={settings.bubbleStyle}
            options={[
              { value: 'rounded', label: 'Rounded (Default)' },
              { value: 'compact', label: 'Compact' },
              { value: 'modern', label: 'Modern' },
            ]}
            onChange={(v) => updateSetting('bubbleStyle', v as ChatSettings['bubbleStyle'])}
          />
          <SelectSetting
            label="Font Size"
            value={settings.fontSize}
            options={[
              { value: 'sm', label: 'Small' },
              { value: 'md', label: 'Medium (Default)' },
              { value: 'lg', label: 'Large' },
            ]}
            onChange={(v) => updateSetting('fontSize', v as ChatSettings['fontSize'])}
          />
          <Toggle
            label="Enter to Send"
            description="Press Enter to send, Shift+Enter for new line"
            checked={settings.enterToSend}
            onChange={(v) => updateSetting('enterToSend', v)}
          />
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader><CardTitle><Eye size={16} className="mr-1.5 inline" /> Privacy</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <SelectSetting
            label="Who Can Message You"
            description="Control who can start a conversation with you"
            value={settings.whoCanMessage}
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'matches', label: 'Matches Only' },
              { value: 'nobody', label: 'No One' },
            ]}
            onChange={(v) => updateSetting('whoCanMessage', v as ChatSettings['whoCanMessage'])}
          />
          <SelectSetting
            label="Online Status"
            description="Who can see when you're online"
            value={settings.onlineVisibility}
            options={[
              { value: 'everyone', label: 'Everyone' },
              { value: 'matches', label: 'Matches Only' },
              { value: 'nobody', label: 'No One' },
            ]}
            onChange={(v) => updateSetting('onlineVisibility', v as ChatSettings['onlineVisibility'])}
          />
        </CardContent>
      </Card>

      {/* Media */}
      <Card>
        <CardHeader><CardTitle><Download size={16} className="mr-1.5 inline" /> Media & Files</CardTitle></CardHeader>
        <CardContent className="space-y-0 -mt-1">
          <Toggle
            label="Auto-download Images"
            description="Automatically download images in chats"
            checked={settings.autoDownloadImages}
            onChange={(v) => updateSetting('autoDownloadImages', v)}
          />
          <Toggle
            label="Video Autoplay"
            description="Auto-play videos in chat"
            checked={settings.videoAutoplay}
            onChange={(v) => updateSetting('videoAutoplay', v)}
          />
        </CardContent>
      </Card>

      {/* Blocked Users */}
      <Card>
        <CardHeader><CardTitle><Ban size={16} className="mr-1.5 inline" /> Blocked Users</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserX size={14} />
              <span>
                {blockedCount > 0
                  ? `${blockedCount} user${blockedCount === 1 ? '' : 's'} blocked`
                  : 'No blocked users'}
              </span>
            </div>
            <Link href="/blocked">
              <Button variant="secondary" size="sm">Manage</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader><CardTitle><Monitor size={16} className="mr-1.5 inline" /> Data Management</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/20 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Clear Chat History</p>
              <p className="text-xs text-muted-foreground mt-0.5">Remove all your conversations</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearHistory} disabled={clearingHistory} className="text-danger">
              {clearingHistory ? <Loader2 size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
              Clear
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/20 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Export Chats</p>
              <p className="text-xs text-muted-foreground mt-0.5">Download your conversation data</p>
            </div>
            <Button variant="secondary" size="sm" disabled>
              <DownloadCloud size={14} className="mr-1" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info footer */}
      <p className="text-center text-xs text-muted-foreground pb-6">
        Settings are saved automatically to your browser. Sign in on another device to sync.
      </p>
    </div>
  );
}
