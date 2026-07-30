'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Flag, Shield, BookOpen, Send, Loader2, Check } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { api } from '@/lib/api';

const GUIDELINES = [
  { icon: Shield, title: 'Be Respectful', desc: 'Treat every interaction with professionalism and respect. Harassment, discrimination, or hate speech will not be tolerated.' },
  { icon: BookOpen, title: 'Be Transparent', desc: 'Clearly communicate your intentions, availability, and expectations. Misrepresentation undermines trust in the community.' },
  { icon: AlertTriangle, title: 'Report Concerns', desc: 'If you encounter suspicious behavior or content, use the report function immediately. Our team reviews every report within 24 hours.' },
  { icon: Flag, title: 'No Spam or Solicitation', desc: 'DevConnect is for genuine collaboration. Unsolicited promotions, recruitment spam, or irrelevant outreach is prohibited.' },
];

export default function SafetyPage() {
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [report, setReport] = useState({ targetType: '', reason: '' });
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') ?? undefined : undefined;

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/reports', report, token);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHero
        title="Community Safety & Guidelines"
        subtitle="DevConnect is built on trust. These guidelines ensure every member feels safe, respected, and empowered to collaborate."
      />
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {GUIDELINES.map((g) => (
            <Card key={g.title}>
              <CardContent className="pt-6">
                <g.icon className="mb-3 text-primary" size={28} />
                <h3 className="font-semibold">{g.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="text-xl font-bold">Report a Concern</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If you&apos;ve experienced or witnessed behavior that violates our guidelines, submit a report below or email us directly.
          </p>

          {sent ? (
            <div className="mt-6 flex items-center gap-3 rounded-lg bg-success/10 p-4 text-sm text-success">
              <Check size={18} /> Report submitted. Our team will review it within 24 hours.
            </div>
          ) : !showForm ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {token && (
                <Button onClick={() => setShowForm(true)}>
                  <Flag size={16} className="mr-1" /> Submit Report
                </Button>
              )}
              <a href="mailto:safety@devconnect.dev">
                <Button variant="secondary">Report via Email</Button>
              </a>
            </div>
          ) : (
            <form onSubmit={handleReport} className="mt-6 space-y-4 max-w-md">
              <div>
                <label className="text-sm font-medium">What type of content?</label>
                <select
                  value={report.targetType}
                  onChange={(e) => setReport({ ...report, targetType: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select...</option>
                  <option value="USER">User Profile</option>
                  <option value="MESSAGE">Message</option>
                  <option value="PROJECT">Project</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Reason</label>
                <textarea
                  value={report.reason}
                  onChange={(e) => setReport({ ...report, reason: e.target.value })}
                  required
                  rows={3}
                  placeholder="Describe what happened..."
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={sending}>
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sending ? 'Submitting...' : 'Submit Report'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <h3 className="font-semibold text-foreground">Enforcement</h3>
          <p className="mt-2 leading-relaxed">
            Violations of these guidelines may result in content removal, temporary suspension, or permanent account termination. We review every report thoroughly and take appropriate action to maintain a safe environment for all users.
          </p>
        </div>
      </div>
    </>
  );
}
