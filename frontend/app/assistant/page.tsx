'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Help me improve my profile',
  'Suggest projects I should apply to',
  'What skills should I learn?',
  'How do I get more matches?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am your AI copilot. I can help you optimize your profile, find matches, and more. What would you like help with?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleSend(content: string) {
    if (!content.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response ?? 'I am processing your request.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'I am having trouble connecting. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col px-6 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Bot size={20} className="text-primary" />
        <h1 className="text-xl font-bold tracking-tight">AI Assistant</h1>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Copilot</span>
      </div>

      <Card className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role === 'assistant' && <Bot size={20} className="mt-1 shrink-0 text-primary" />}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user' ? 'gradient-brand text-white' : 'bg-muted text-foreground'
              }`}>
                {m.content}
              </div>
              {m.role === 'user' && <User size={20} className="mt-1 shrink-0 text-muted-foreground" />}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <Bot size={20} className="mt-1 shrink-0 text-primary" />
              <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground animate-pulse">Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => handleSend(s)}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Sparkles size={10} /> {s}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything…"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand text-white"><Send size={16} /></button>
          </form>
        </div>
      </Card>
    </div>
  );
}
