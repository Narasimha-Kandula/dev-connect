'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, BarChart, Megaphone } from 'lucide-react';

const COOKIE_TYPES = [
  {
    icon: Shield,
    name: 'Essential',
    desc: 'Required for platform operation. Authentication, session management, and security tokens.',
    always: true,
    examples: ['session_token', 'csrf_token', 'auth_refresh'],
  },
  {
    icon: BarChart,
    name: 'Analytics',
    desc: 'Help us understand how the platform is used so we can improve features and performance.',
    always: false,
    examples: ['_ga', '_gid', 'page_view'],
  },
  {
    icon: Megaphone,
    name: 'Marketing',
    desc: 'Used to deliver relevant advertisements and track campaign effectiveness.',
    always: false,
    examples: ['_fbp', 'ads_id', 'campaign_ref'],
  },
];

export default function CookiesPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    analytics: false,
    marketing: false,
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem('cookie_preferences', JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleRejectAll() {
    setPrefs({ analytics: false, marketing: false });
    localStorage.setItem('cookie_preferences', JSON.stringify({ analytics: false, marketing: false }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Cookie Usage.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 1, 2026</p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          We use cookies to keep your account secure, understand platform usage, and improve your experience.
          You can control which non-essential cookies you allow.
        </p>
      </div>

      <div className="space-y-4">
        {COOKIE_TYPES.map((c) => (
          <Card key={c.name}>
            <CardContent className="flex items-start gap-4 pt-6">
              <c.icon className="shrink-0 text-primary" size={24} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{c.name}</p>
                  {c.always ? (
                    <span className="text-xs text-muted-foreground">Always active</span>
                  ) : (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={prefs[c.name.toLowerCase() as keyof typeof prefs]}
                        onChange={(e) =>
                          setPrefs((p) => ({ ...p, [c.name.toLowerCase()]: e.target.checked }))
                        }
                        className="rounded"
                      />
                      Enabled
                    </label>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Examples: {c.examples.join(', ')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave}>{saved ? 'Preferences Saved' : 'Save Preferences'}</Button>
        <Button variant="secondary" onClick={handleRejectAll}>Reject All Non-Essential</Button>
      </div>
    </div>
  );
}
