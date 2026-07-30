'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2, Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface MatchActionsProps {
  matchId: string;
  partnerId: string;
  conversationId?: string;
  onStarted?: (projectId: string) => void;
}

export function MatchActions({ matchId, partnerId, conversationId, onStarted }: MatchActionsProps) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(false);

  async function handleStartProject() {
    setLoading(true);
    try {
      const result = await api.post<{ projectId: string }>(
        `/matches/${matchId}/start-project`,
        { partnerId, conversationId },
        token ?? undefined,
      );
      toast.success('Collab room created! Setting up your project…');
      onStarted?.(result.projectId);
      router.push(`/projects/${result.projectId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleStartProject}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
      {loading ? 'Creating…' : 'Start Project'}
    </button>
  );
}
