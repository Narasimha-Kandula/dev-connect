import Link from 'next/link';
import { Sparkles, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success" />
          2,341 developers building right now
        </div>

        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          Find Your Next <span className="text-primary">Tech Co-Founder</span>.
          <br /> Build Faster, Launch Stronger.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Move beyond job boards. Connect, collaborate, and ship products with
          AI-vetted developers in real-time.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="gradient-brand inline-flex items-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md hover:opacity-90"
          >
            Start Building Free <ArrowRight size={18} />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-semibold hover:bg-muted"
          >
            Explore Product Demo
          </Link>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Trusted by 500+ engineering teams
        </p>
      </section>

      {/* Value Pillars */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <Sparkles className="mb-4 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">AI-Driven Matching</h3>
              <p className="text-sm text-muted-foreground">
                Hyper-relevant matches based on tech stack, experience, and intent.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Users className="mb-4 text-accent" />
              <h3 className="mb-2 text-lg font-semibold">Real-Time Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Chat, video, and shared coding environments — all built in.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <ShieldCheck className="mb-4 text-success" />
              <h3 className="mb-2 text-lg font-semibold">Enterprise-Grade Security</h3>
              <p className="text-sm text-muted-foreground">
                RBAC, SSO-ready auth, encrypted sessions, audited access.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <h2 className="mb-10 text-center text-3xl font-bold">
          From Profile to Partnership in Minutes
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: '01', title: 'Create Your Developer Profile', desc: 'Import GitHub, add skills, set availability.' },
            { step: '02', title: 'Discover & Match', desc: 'Swipe through AI-ranked developers and projects.' },
            { step: '03', title: 'Collaborate Instantly', desc: 'Chat, video call, and co-build in shared workspaces.' },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-border p-6">
              <span className="text-sm font-bold text-primary">{s.step}</span>
              <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="gradient-brand mx-6 mb-16 rounded-2xl px-6 py-16 text-center text-white sm:mx-auto sm:max-w-5xl">
        <h2 className="text-3xl font-bold">Join thousands building the future.</h2>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-primary hover:opacity-90"
        >
          Start Building Free <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
