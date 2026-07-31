import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Target, Eye } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Built for developers, by developers. Learn about our mission to eliminate the friction between developer intent and action.',
  openGraph: {
    title: 'About',
    description:
      'Built for developers, by developers — mission, team, and milestones.',
  },
  alternates: { canonical: '/about' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'DevConnect',
  url: 'https://devconnect.dev',
  description:
    'Find your next tech co-founder and build something great. AI-powered developer matching platform.',
  founder: [
    { '@type': 'Person', name: 'Alex Rivera' },
    { '@type': 'Person', name: 'Maya Chen' },
    { '@type': 'Person', name: 'James Okafor' },
  ],
};

const TEAM = [
  {
    name: 'Alex Rivera',
    role: 'Founder & CEO',
    bio: '10 yr engineer, ex-FAANG. Built developer tools used by 50k+ teams.',
  },
  {
    name: 'Maya Chen',
    role: 'CTO',
    bio: 'Distributed systems architect. Previously led infra at a Series-C startup.',
  },
  {
    name: 'James Okafor',
    role: 'Head of Product',
    bio: 'Product-led growth specialist. Scaled two platforms to 1M+ users.',
  },
];

const MILESTONES = [
  { year: '2024 Q3', event: 'Idea validated with 200 beta testers' },
  { year: '2024 Q4', event: 'Public launch with core matching engine' },
  { year: '2025 Q1', event: '10,000 registered developers milestone' },
  { year: '2025 Q3', event: 'Enterprise SSO, video rooms, and AI matching shipped' },
  { year: '2026 Q1', event: 'Trusted by 500+ engineering teams globally' },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        title="Built for Developers, By Developers."
        subtitle="We experienced the friction of finding technical co-founders firsthand. Long job posts, cold outreach, mismatched expectations. So we built the platform we wished existed."
      />
      <div className="mx-auto max-w-5xl space-y-16 px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <Target className="mb-3 text-primary" size={28} />
              <h2 className="font-semibold">Our Mission</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Eliminate the friction between developer intent and action. Make
                finding a co-founder as seamless as finding the right API.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Eye className="mb-3 text-accent" size={28} />
              <h2 className="font-semibold">Our Vision</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                A world where every developer — regardless of geography or
                network — can find the right partner to build something
                meaningful.
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-bold">Meet the Team</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {TEAM.map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-6 text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{t.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-6 text-2xl font-bold">Milestones</h2>
          <div className="space-y-4">
            {MILESTONES.map((m) => (
              <div key={m.year} className="flex items-start gap-4 border-l-2 border-primary pl-4">
                <p className="min-w-[80px] text-sm font-bold text-primary">{m.year}</p>
                <p className="text-sm text-muted-foreground">{m.event}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/signup"
            className="gradient-brand inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
          >
            Join Our Community <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </>
  );
}
