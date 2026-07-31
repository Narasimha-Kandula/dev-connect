import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Users, Code2, ArrowRight, Sparkles } from 'lucide-react';
import { SKILLS, SKILL_SLUGS, getSkillInfo, getSkillTitle, getSkillDescription } from '@/lib/discover-seo';
import { DeveloperListing } from './client';

// ─── Static Paths ───

export function generateStaticParams() {
  return SKILL_SLUGS.map((slug) => ({ skill: slug }));
}

// ─── Metadata ───

export async function generateMetadata({ params }: { params: Promise<{ skill: string }> }): Promise<Metadata> {
  const { skill } = await params;
  const info = getSkillInfo(skill);

  if (!info) {
    return {
      title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} Developers`,
      description: `Find ${skill} developers for collaboration on DevConnect.`,
    };
  }

  return {
    title: info.title,
    description: info.metaDescription,
    keywords: info.keywords,
    openGraph: {
      title: info.title,
      description: info.metaDescription,
      url: `https://devconnect.dev/developers/${skill}`,
      siteName: 'DevConnect',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: info.title,
      description: info.metaDescription,
    },
    alternates: {
      canonical: `https://devconnect.dev/developers/${skill}`,
    },
  };
}

// ─── Page ───

export default async function DevelopersBySkillPage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  const info = getSkillInfo(skill);

  if (!info) {
    return <NotFoundPage skill={skill} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href="/developers" className="hover:text-foreground transition-colors">Developers</Link>
            <ChevronRight size={14} />
            <span className="text-foreground font-medium">{info.name}</span>
          </nav>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
                <Code2 size={14} />
                {info.name} Developers
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                {info.heading}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground leading-relaxed">
                {info.subheading}
              </p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xl">
                {info.about}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={16} />
                  Join as {info.name} Developer
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
                >
                  <Users size={16} />
                  Browse All Developers
                </Link>
              </div>
            </div>

            {/* Related Skills */}
            <div className="shrink-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Related Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {info.relatedSkills.map((related) => {
                  const relatedInfo = getSkillInfo(related);
                  return (
                    <Link
                      key={related}
                      href={`/developers/${related}`}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted/30 transition-colors"
                    >
                      {relatedInfo?.name ?? related}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <DeveloperListing skill={info.name} />

        {/* SEO Content Section */}
        <section className="mt-16 border-t border-border pt-12">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Why Find {info.name} Developers on DevConnect?
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" />
                  <span>AI-powered matching that evaluates tech stack, experience, and collaboration intent — not just keywords.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users size={16} className="mt-0.5 shrink-0 text-primary" />
                  <span>Active community of vetted {info.name} developers ready to collaborate on projects.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Code2 size={16} className="mt-0.5 shrink-0 text-primary" />
                  <span>Real-time chat, project management tools, and collaborative features built for developers.</span>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Popular {info.name} Skills & Tools
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {getSkillTags(info.slug).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to Find Your Next {info.name} Collaborator?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
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
              Browse {info.name} Developers
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Helpers ───

function getSkillTags(slug: string): string[] {
  const tagMap: Record<string, string[]> = {
    react: ['React 18/19', 'Next.js', 'Remix', 'React Query', 'Zustand', 'Redux', 'Tailwind CSS', 'Framer Motion'],
    nextjs: ['App Router', 'Server Components', 'API Routes', 'Middleware', 'ISR', 'SSR', 'SSG', 'Turbopack'],
    python: ['Django', 'FastAPI', 'Flask', 'PyTorch', 'TensorFlow', 'Pandas', 'NumPy', 'Jupyter'],
    nodejs: ['Express', 'NestJS', 'Fastify', 'Serverless', 'GraphQL', 'Prisma', 'TypeORM', 'WebSockets'],
    typescript: ['TypeScript 5.x', 'Generics', 'Decorators', 'Module Resolution', 'JSDoc', 'tsconfig', 'ESLint', 'Vitest'],
    javascript: ['ES2024', 'Async/Await', 'Promises', 'Closures', 'Prototypes', 'Web APIs', 'Node.js', 'npm/yarn/pnpm'],
    golang: ['Go 1.22+', 'Goroutines', 'Channels', 'Context', 'Standard Library', 'Gin', 'Echo', 'gRPC'],
    rust: ['Rust 2024', 'Ownership', 'Borrowing', 'Lifetimes', 'Traits', 'Cargo', 'WASM', 'Tokio'],
    'machine-learning': ['PyTorch', 'TensorFlow', 'Scikit-learn', 'Hugging Face', 'LangChain', 'RAG', 'LLMs', 'Computer Vision'],
    devops: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'GitHub Actions', 'Prometheus', 'Grafana', 'Helm'],
  };
  return tagMap[slug] ?? [];
}

// ─── 404 Fallback ───

function NotFoundPage({ skill }: { skill: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="text-6xl font-black text-primary/20">404</span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Skill Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We don&apos;t have a page for &ldquo;{skill}&rdquo; yet. Try searching for another skill.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/developers" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          Browse All Skills
        </Link>
        <Link href="/discover" className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors">
          Discover Developers
        </Link>
      </div>
    </div>
  );
}
