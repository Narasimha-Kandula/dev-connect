'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Video, Loader2 } from 'lucide-react';

export default function CallRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [loading, setLoading] = useState(true);

  const jitsiUrl = `https://meet.jit.si/DevConnect-${roomId}#config.startWithAudioMuted=true&config.startWithVideoMuted=true`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-4 border-b border-border bg-card px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="h-4 w-px bg-border" />
        <Video size={18} className="text-primary" />
        <span className="text-sm font-medium">Call: {roomId}</span>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 size={36} className="mx-auto animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Connecting to call...</p>
          </div>
        </div>
      )}

      <iframe
        src={jitsiUrl}
        title="Video Call"
        allow="camera; microphone; screen-wake-lock; autoplay; display-capture"
        onLoad={() => setLoading(false)}
        className={`flex-1 border-0 ${loading ? 'hidden' : ''}`}
      />
    </div>
  );
}
