'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Users, ShieldCheck, Building2, Brain, Workflow } from 'lucide-react';

const TABS = [
  { id: 'matching', label: 'Matching Engine', icon: Brain },
  { id: 'collab', label: 'Collaboration', icon: Users },
  { id: 'profiles', label: 'Smart Profiles', icon: Sparkles },
  { id: 'admin', label: 'Team & Admin', icon: Building2 },
];

const TAB_CONTENT: Record<string, { title: string; desc: string; features: string[] }> = {
  matching: {
    title: 'Hyper-Relevant Matching Engine',
    desc: 'Our AI evaluates tech stack, experience, and collaboration intent to surface the most compatible developers — not just those with overlapping keywords.',
    features: [
      'Skill-weighted similarity scoring',
      'Intent-based filtering (collab, hire, mentor)',
      'Real-time availability signals',
      'Continuous learning from user feedback',
    ],
  },
  collab: {
    title: 'Real-Time Collaboration Workspace',
    desc: 'Built-in tools that let you go from match to productive partnership without switching context.',
    features: [
      'WebRTC video calls with screen sharing',
      'Shared live code editor',
      'Persistent chat with file sharing',
      'Session recording for async review',
    ],
  },
  profiles: {
    title: 'Smart Developer Profiles',
    desc: 'Auto-enriched profiles that reduce manual input and surface authentic skill signals.',
    features: [
      'GitHub/GitLab auto-import (repos, languages, contributions)',
      'Skill verification via endorsements and tests',
      'Reputation score based on community activity',
      'Portfolio showcase with live project links',
    ],
  },
  admin: {
    title: 'Team & Admin Controls',
    desc: 'Enterprise-grade tools for managing organizations, permissions, and compliance.',
    features: [
      'Role-based access control (RBAC)',
      'SSO via SAML / OIDC',
      'Usage analytics and audit logs',
      'Member onboarding and offboarding workflows',
    ],
  },
};

export default function FeaturesPage() {
  const [active, setActive] = useState('matching');

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Engineered for High-Performance Teams.
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Every capability is built to reduce friction and accelerate developer collaboration.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 border-b border-border pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 rounded-t-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              active === tab.id
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">{TAB_CONTENT[active].title}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{TAB_CONTENT[active].desc}</p>
              <ul className="mt-6 space-y-3">
                {TAB_CONTENT[active].features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Workflow size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-muted p-8">
              <div className="text-center text-muted-foreground">
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  <Brain size={36} className="text-primary" />
                </div>
                <p className="text-sm">Interactive feature preview</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, label: 'Encrypted', detail: 'TLS 1.3 + AES-256 at rest' },
          { icon: Users, label: 'Community', detail: '2,500+ active developers' },
          { icon: Sparkles, label: 'AI-Powered', detail: 'ML-driven match ranking' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <s.icon className="text-primary shrink-0" size={24} />
              <div>
                <p className="font-semibold text-sm">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
