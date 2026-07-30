'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { PresenceList } from '@/components/PresenceList';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Avatar } from '@/lib/avatar';
import { Loader2, Code, Pen, Users, Phone, PhoneOff, Maximize2, Minimize2 } from 'lucide-react';
import { toast } from 'sonner';

interface Participant {
  userId: string;
  user: { id: string; profile?: { displayName: string; avatarUrl?: string } };
}

interface CollabRoom {
  id: string;
  name: string;
  projectId: string | null;
  isActive: boolean;
  participants: Participant[];
}

type Tab = 'code' | 'whiteboard' | 'tasks';

export default function CollabRoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.id);
  const [room, setRoom] = useState<CollabRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('code');
  const [voiceOn, setVoiceOn] = useState(false);

  useEffect(() => {
    if (!token || !params.roomId) return;
    api.get<CollabRoom>(`/collab/rooms/${params.roomId}`, token)
      .then((r) => setRoom(r))
      .catch(() => toast.error('Failed to load collab room'))
      .finally(() => setLoading(false));
  }, [params.roomId, token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Room not found</p>
        <button onClick={() => router.back()} className="text-sm text-primary hover:underline">Go back</button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'code', label: 'Code Editor', icon: <Code size={16} /> },
    { key: 'whiteboard', label: 'Whiteboard', icon: <Pen size={16} /> },
    { key: 'tasks', label: 'Tasks', icon: <Users size={16} /> },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">{room.name}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-medium text-green-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          {room.projectId && (
            <button
              onClick={() => router.push(`/projects/${room.projectId}`)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              View Project
            </button>
          )}
          <button
            onClick={() => setVoiceOn((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-xs ${
              voiceOn ? 'border-red-300 bg-red-50 text-red-600' : 'border-border hover:bg-muted'
            }`}
          >
            {voiceOn ? <PhoneOff size={14} /> : <Phone size={14} />}
            <span className="ml-1.5">{voiceOn ? 'Leave Voice' : 'Voice Chat'}</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {/* Tab Bar */}
          <div className="flex border-b border-border bg-muted/30 px-4">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'code' && <CodeEditorTab />}
          {activeTab === 'whiteboard' && <WhiteboardTab />}
          {activeTab === 'tasks' && room.projectId ? (
            <div className="p-6">
              <KanbanBoard projectId={room.projectId} />
            </div>
          ) : activeTab === 'tasks' ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
              <p>No project linked to this room</p>
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0 border-l border-border bg-muted/20 p-4">
          {userId && <PresenceList roomId={room.id} currentUserId={userId} />}

          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Participants ({room.participants.length})</p>
            <div className="flex flex-col gap-1.5">
              {room.participants.map((p) => (
                <div key={p.userId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50">
                  <Avatar src={p.user.profile?.avatarUrl} name={p.user.profile?.displayName || '?'} size="xs" />
                  <span className="truncate">{p.user.profile?.displayName || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeEditorTab() {
  const [content, setContent] = useState('// Start coding here\n\n');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="h-full p-4">
      <div className="h-full rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">main.ts</span>
          <span className="text-[10px] text-muted-foreground">Collaborative (Y.js ready)</span>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-full w-full resize-none bg-card p-4 font-mono text-sm outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function WhiteboardTab() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
      <div className="flex h-[500px] w-full max-w-4xl items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20">
        <div className="text-center">
          <Pen size={40} className="mx-auto text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Whiteboard</p>
          <p className="text-xs text-muted-foreground/60">tldraw integration ready — connect your LiveKit token</p>
        </div>
      </div>
    </div>
  );
}
