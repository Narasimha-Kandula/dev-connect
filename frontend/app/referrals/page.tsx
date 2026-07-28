'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Share2, Users, Award } from 'lucide-react';

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://devconnect.dev/ref/your-code-here';

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><Gift size={20} className="mr-2 inline" /> Referrals</h1>
      <p className="text-sm text-muted-foreground">Invite developers and earn rewards.</p>

      <Card>
        <CardContent className="pt-6 text-center">
          <Share2 size={32} className="mx-auto mb-3 text-primary" />
          <p className="font-semibold">Your Referral Link</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-input bg-muted px-4 py-2">
            <code className="flex-1 text-xs">{referralLink}</code>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              <Copy size={14} className="mr-1" /> {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users size={24} className="mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Invites Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Award size={24} className="mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Conversions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Gift size={24} className="mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Rewards Earned</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Rewards Tiers</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { invites: 1, reward: 'Pro features for 1 month' },
            { invites: 5, reward: 'Pro features for 6 months' },
            { invites: 10, reward: 'Enterprise plan for 1 year' },
          ].map((t) => (
            <div key={t.invites} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span>{t.invites} referral{t.invites > 1 ? 's' : ''}</span>
              <span className="font-medium text-primary">{t.reward}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
