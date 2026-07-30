import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, UserPlus, Compass, MessageCircle } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';

export const metadata: Metadata = {
  title: 'How It Works — DevConnect',
  description:
    'From profile to partnership in minutes. Create your developer profile, discover AI-matched candidates, and collaborate in real-time.',
  openGraph: {
    title: 'How It Works — DevConnect',
    description:
      'Create your profile, discover matches, and collaborate in real-time.',
  },
  alternates: { canonical: '/how-it-works' },
};

const STEPS = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create Your Developer Profile',
    desc: 'Sign up in under 60 seconds. Import your GitHub repositories, select your tech stack, and set your availability. Your profile is auto-enriched with real contribution data.',
    detail: 'GitHub auto-import · Skill tags · Availability toggle',
  },
  {
    icon: Compass,
    step: '02',
    title: 'Discover & Match',
    desc: 'Browse AI-ranked developer profiles and projects. Swipe right to express interest — when interest is mutual, you match instantly and a conversation channel opens.',
    detail: 'AI ranking · Skill filters · Mutual match trigger',
  },
  {
    icon: MessageCircle,
    step: '03',
    title: 'Collaborate Instantly',
    desc: 'Chat, video call, and co-code in a shared workspace. Invite matches to your projects or join theirs. Everything is real-time, from first message to first commit.',
    detail: 'Real-time chat · Video calls · Shared code editor',
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        title="From Profile to Partnership in Minutes"
        subtitle="No cold DMs, no endless job boards. Just a streamlined flow designed to get you building with the right people."
      />
      <div className="mx-auto max-w-5xl space-y-16 px-6 py-16">
        {STEPS.map((s, i) => (
          <div key={s.step} className="grid items-center gap-8 md:grid-cols-2">
            <div className={i % 2 === 1 ? 'md:order-2' : ''}>
              <span className="text-sm font-bold text-primary">{s.step}</span>
              <h2 className="mt-1 text-2xl font-bold">{s.title}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{s.desc}</p>
              <p className="mt-3 text-xs text-muted-foreground">{s.detail}</p>
            </div>
            <div
              className={`flex items-center justify-center rounded-xl bg-muted/30 p-10 ${i % 2 === 1 ? 'md:order-1' : ''}`}
            >
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
                  <s.icon size={40} className="text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Step {s.step} preview</p>
              </div>
            </div>
          </div>
        ))}
        <div className="text-center">
          <Link
            href="/signup"
            className="gradient-brand inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
          >
            Start Building Free <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </>
  );
}
