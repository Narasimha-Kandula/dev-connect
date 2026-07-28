'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, HelpCircle } from 'lucide-react';

const CATEGORIES = [
  { value: 'support', label: 'Technical Support' },
  { value: 'sales', label: 'Sales Inquiry' },
  { value: 'billing', label: 'Billing' },
  { value: 'security', label: 'Security Report' },
  { value: 'other', label: 'Other' },
];

export default function ContactPage() {
  const [category, setCategory] = useState('support');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/contact`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, name, email, message }),
        },
      );
      if (!res.ok) throw new Error('Failed to send message');
      setSent(true);
    } catch {
      setError('Could not send your message. Please email us directly.');
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Talk to Our Team
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Have a question, feedback, or security concern? We are here to help.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Mail className="shrink-0 text-primary" size={20} />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground">support@devconnect.dev</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <MessageCircle className="shrink-0 text-accent" size={20} />
            <div>
              <p className="text-sm font-medium">Live Chat</p>
              <p className="text-xs text-muted-foreground">Available 9am–6pm EST</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <HelpCircle className="shrink-0 text-success" size={20} />
            <div>
              <p className="text-sm font-medium">FAQ</p>
              <p className="text-xs text-muted-foreground"><a href="/faq" className="underline">Browse common questions</a></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Send Us a Message</CardTitle></CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-success">Message sent — we will get back to you within 24 hours.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Message</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit">Send Message</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
