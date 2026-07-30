'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, Send, Check, Loader2 } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { api } from '@/lib/api';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.post('/contact', form);
      setSubmitted(true);
    } catch {
      setError('Failed to send. Please email us directly at support@devconnect.dev.');
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <>
        <PageHero title="Message Sent!" subtitle="We&apos;ll get back to you within 24 hours." />
        <div className="mx-auto max-w-lg px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Check size={32} className="text-success" />
          </div>
          <p className="text-muted-foreground">
            In the meantime, check our{' '}
            <a href="/faq" className="text-primary underline">FAQ</a> for
            quick answers.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        title="Get in Touch"
        subtitle="Have a question, suggestion, or need help? We&apos;d love to hear from you."
      />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <Mail className="mt-1 shrink-0 text-primary" size={20} />
                <div>
                  <p className="font-semibold">Email</p>
                  <a
                    href="mailto:support@devconnect.dev"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    support@devconnect.dev
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-4 pt-6">
                <MessageSquare className="mt-1 shrink-0 text-primary" size={20} />
                <div>
                  <p className="font-semibold">Community</p>
                  <p className="text-sm text-muted-foreground">
                    Join our developer community for discussions and support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="subject" className="text-sm font-medium">Subject</label>
              <input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <textarea
                id="message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                className="mt-1 w-full resize-y rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full gap-2" disabled={sending}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
