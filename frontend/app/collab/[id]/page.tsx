'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Monitor, MessageCircle, Users, Code } from 'lucide-react';

export default function CollabRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(true);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-1">
        <div className="flex flex-1 flex-col">
          <div className="flex-1 bg-muted flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-background text-2xl font-bold text-primary">
                {id?.charAt(0) ?? '?'}
              </div>
              <p className="text-lg font-semibold">Collaboration Room</p>
              <p className="text-sm text-muted-foreground">Room: {id}</p>
              <Button variant="secondary" className="mt-4"><Monitor size={14} className="mr-1" /> Share Screen</Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 border-t border-border bg-background p-4">
            <button onClick={() => setAudioOn(!audioOn)} className={`flex h-10 w-10 items-center justify-center rounded-full ${audioOn ? 'bg-muted text-foreground' : 'bg-danger text-white'}`}>
              {audioOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button onClick={() => setVideoOn(!videoOn)} className={`flex h-10 w-10 items-center justify-center rounded-full ${videoOn ? 'bg-muted text-foreground' : 'bg-danger text-white'}`}>
              {videoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground"><Monitor size={18} /></button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground"><Code size={18} /></button>
            <Button variant="danger" size="sm" className="rounded-full px-6">End Call</Button>
          </div>
        </div>

        {showChat && (
          <div className="flex w-72 flex-col border-l border-border bg-background">
            <div className="flex items-center justify-between border-b border-border p-3">
              <span className="flex items-center gap-2 text-sm font-medium"><MessageCircle size={14} /> Chat</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users size={12} /> 2
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <p className="text-xs text-muted-foreground">Messages appear here during the session.</p>
            </div>
            <div className="border-t border-border p-3">
              <input placeholder="Type a message…" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border bg-background px-4 py-2">
        <p className="text-xs text-muted-foreground">Room: {id}</p>
        <button onClick={() => setShowChat(!showChat)} className="text-xs text-muted-foreground hover:text-foreground">
          {showChat ? 'Hide Chat' : 'Show Chat'}
        </button>
      </div>
    </div>
  );
}
