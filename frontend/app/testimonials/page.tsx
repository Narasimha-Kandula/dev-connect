import { Card, CardContent } from '@/components/ui/card';
import { Quote, TrendingUp, Users, Clock, Zap } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sarah Kim',
    role: 'Co-founder, Techflow',
    avatar: 'SK',
    quote: 'DevConnect replaced three months of networking in three days. We found our lead engineer through a match and shipped our MVP seven weeks later.',
    metric: '3 months → 3 days',
    metricLabel: 'Time to find co-founder',
  },
  {
    name: 'Marcus Johnson',
    role: 'Independent Developer',
    avatar: 'MJ',
    quote: 'The AI matching is eerily accurate. Every match had relevant skills and genuine interest in the same problem space. It saved hours of manual filtering.',
    metric: '90%',
    metricLabel: 'Match relevance rate',
  },
  {
    name: 'Priya Patel',
    role: 'CTO, Datalens',
    avatar: 'PP',
    quote: 'We onboarded our entire engineering team through DevConnect. The SSO integration and role-based access made enterprise adoption seamless.',
    metric: '200+',
    metricLabel: 'Team members onboarded',
  },
  {
    name: 'Elena Torres',
    role: 'Open Source Maintainer',
    avatar: 'ET',
    quote: 'I found two co-maintainers for my open source project. The collab workspace with shared code editing made it feel like we were pair-programming in person.',
    metric: '2x',
    metricLabel: 'Contributions after matching',
  },
  {
    name: 'David Park',
    role: 'Founder, Buildright',
    avatar: 'DP',
    quote: 'As a non-technical founder, I needed a technical co-founder I could trust. DevConnect\'s reputation scores and GitHub integration gave me confidence in every match.',
    metric: '5/5',
    metricLabel: 'Founder satisfaction',
  },
  {
    name: 'Aisha Okafor',
    role: 'Engineering Manager, Scaleup Inc.',
    avatar: 'AO',
    quote: 'We use DevConnect as our primary sourcing tool. The talent quality is consistently higher than traditional job boards, and the time-to-hire is half.',
    metric: '50%',
    metricLabel: 'Faster time-to-hire',
  },
];

const STATS = [
  { icon: Users, value: '50,000+', label: 'Developers' },
  { icon: TrendingUp, value: '15,000+', label: 'Successful Matches' },
  { icon: Clock, value: '4.2 days', label: 'Avg time to match' },
  { icon: Zap, value: '94%', label: 'Satisfaction rate' },
];

export default function TestimonialsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Trusted by Builders Worldwide
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
          Real stories from developers, founders, and teams who found their match on DevConnect.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6 text-center">
              <s.icon className="mx-auto mb-2 text-primary" size={28} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <Card key={t.name} className="flex flex-col">
            <CardContent className="flex flex-1 flex-col pt-6">
              <Quote size={20} className="mb-2 text-primary/40" />
              <p className="flex-1 text-sm text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-primary">
                  {t.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{t.metric}</p>
                  <p className="text-xs text-muted-foreground">{t.metricLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
