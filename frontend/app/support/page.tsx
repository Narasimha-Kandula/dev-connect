'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { HelpCircle, Ticket, MessageCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/support/tickets', { subject, description, priority });
      setSent(true);
    } catch {}
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><HelpCircle size={20} className="mr-2 inline" /> Support</h1>
      <p className="text-sm text-muted-foreground">Get help from our team.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <MessageCircle size={20} className="text-primary" />
            <div>
              <p className="text-sm font-medium">Live Chat</p>
              <p className="text-xs text-muted-foreground">Available 9am–6pm EST</p>
            </div>
          </CardContent>
        </Card>
        <Link href="/faq">
          <Card className="cursor-pointer">
            <CardContent className="flex items-center gap-3 pt-6">
              <FileText size={20} className="text-accent" />
              <div>
                <p className="text-sm font-medium">FAQ</p>
                <p className="text-xs text-muted-foreground">Browse common questions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/contact">
          <Card className="cursor-pointer">
            <CardContent className="flex items-center gap-3 pt-6">
              <HelpCircle size={20} className="text-success" />
              <div>
                <p className="text-sm font-medium">Contact</p>
                <p className="text-xs text-muted-foreground">Email support team</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle><Ticket size={16} className="mr-1 inline" /> Create Ticket</CardTitle></CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-success">Ticket submitted — we will respond within 24 hours.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <Button type="submit">Submit Ticket</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
