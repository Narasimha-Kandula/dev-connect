'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, FileText, Download, Check } from 'lucide-react';

const PLANS = [
  { name: 'Free', price: '$0', features: ['Unlimited matching', 'Basic chat', '3 active projects', 'Community support'] },
  { name: 'Pro', price: '$29', features: ['Everything in Free', 'Video rooms', 'Advanced analytics', 'Priority support', '10 active projects', 'AI recommendations'] },
  { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'SSO (SAML/OIDC)', 'Custom integrations', 'Dedicated support', 'Unlimited projects', 'SLA guarantee'] },
];

export default function BillingPage() {
  const [currentPlan] = useState('Free');

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight"><CreditCard size={20} className="mr-2 inline" /> Billing</h1>
      <p className="text-sm text-muted-foreground">Manage your subscription and payment methods.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.name} className={`relative ${p.name === currentPlan ? 'border-primary' : ''}`}>
            {p.name === currentPlan && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">Current</span>
            )}
            <CardContent className="pt-8 text-center">
              <p className="text-lg font-bold">{p.name}</p>
              <p className="mt-1 text-3xl font-extrabold">{p.price}<span className="text-sm font-normal text-muted-foreground">{p.name !== 'Enterprise' ? '/mo' : ''}</span></p>
              <ul className="mt-4 space-y-2 text-left text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-success" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              {p.name !== currentPlan && (
                <Button className="mt-6 w-full">{p.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No payment methods on file.</p>
          <Button variant="secondary" size="sm" className="mt-3">Add Payment Method</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle><FileText size={16} className="mr-1 inline" /> Invoices</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No invoices yet.
        </CardContent>
      </Card>
    </div>
  );
}
