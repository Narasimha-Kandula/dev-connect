import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Code2, Sparkles, Users, Search } from 'lucide-react';
import { SKILLS, SKILL_SLUGS, getSkillInfo } from '@/lib/discover-seo';

export const metadata: Metadata = {
  title: 'Browse Developers by Skill — DevConnect',
  description:
    'Find developers by skill for collaboration on DevConnect. Browse React, Next.js, Python, Node.js, Go, Rust, ML, and more.',
  openGraph: {
    title: 'Browse Developers by Skill — DevConnect',
    description: 'Find your next tech collaborator by skill. Browse top developers across every major stack.',
    url: 'https://devconnect.dev/developers',
    siteName: 'DevConnect',
    type: 'website',
  },
  alternates: {
    canonical: 'https://devconnect.dev/developers',
  },
};

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20 text-center">
          <nav className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Developers</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Browse Developers by Skill
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Find your next collaborator, co-founder, or project partner across every major technology stack.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="gradient-brand inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
            >
              <Search size={16} />
              Discover Developers
            </Link>
          </div>
        </div>
      </section>

      {/* Skills Grid */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SKILL_SLUGS.map((slug) => {
            const info = getSkillInfo(slug);
            if (!info) return null;
            return (
              <Link
                key={slug}
                href={`/developers/${slug}`}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <Code2 size={20} className="text-primary" />
                  <ArrowRight size={16} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h2 className="mt-4 text-lg font-bold tracking-tight group-hover:text-primary transition-colors">{info.name}</h2>
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{info.subheading}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {info.relatedSkills.slice(0, 3).map((rel) => (
                    <span key={rel} className="rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {getSkillInfo(rel)?.name ?? rel}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <section className="mt-16 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight">Ready to Find Your Next Collaborator?</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Join thousands of developers already using DevConnect to find co-founders, collaborators, and build amazing projects together.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
            >
              <Users size={16} />
              Browse Developers
            </Link>
          </div>
        </section>

        {/* SEO Text */}
        <section className="mt-16 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Why Find Developers on DevConnect?</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
                <span>AI-powered matching that evaluates tech stack, experience, and collaboration intent — not just keywords.</span>
              </li>
              <li className="flex items-start gap-3">
                <Users size={16} className="mt-0.5 shrink-0 text-primary" />
                <span>Active community of vetted developers ready to collaborate on projects.</span>
              </li>
              <li className="flex items-start gap-3">
                <Code2 size={16} className="mt-0.5 shrink-0 text-primary" />
                <span>Real-time chat, project management tools, and collaborative features built for developers.</span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">All Developer Categories</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {SKILL_SLUGS.map((slug) => {
                const info = getSkillInfo(slug);
                if (!info) return null;
                return (
                  <Link
                    key={slug}
                    href={`/developers/${slug}`}
                    className="rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {info.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
