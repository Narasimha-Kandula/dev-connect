import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Key, Eye, Server, UserCheck } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';

export const metadata: Metadata = {
  title: 'Security — DevConnect',
  description:
    'Enterprise-grade security: TLS 1.3 encryption, AES-256 at rest, RBAC, SSO-ready auth, and regular third-party audits.',
  alternates: { canonical: '/security' },
};

const ITEMS = [
  {
    icon: Lock,
    title: 'Encryption in Transit',
    desc: 'All traffic is encrypted with TLS 1.3. Every API request, WebSocket message, and page load is protected against eavesdropping and tampering.',
  },
  {
    icon: Server,
    title: 'Encryption at Rest',
    desc: 'Data is encrypted using AES-256. Database backups, file storage, and cached data are all encrypted with industry-standard algorithms.',
  },
  {
    icon: Key,
    title: 'Authentication',
    desc: 'OAuth 2.0 with GitHub and Google, plus email/password with bcrypt hashing. Session tokens are short-lived and rotated regularly.',
  },
  {
    icon: UserCheck,
    title: 'Role-Based Access Control',
    desc: 'Granular permissions control who can view, edit, or manage resources. RBAC ensures users only access what they need.',
  },
  {
    icon: Eye,
    title: 'Audit Logging',
    desc: 'All sensitive operations are logged with timestamps, IP addresses, and user identifiers. Logs are immutable and retained for 90 days.',
  },
  {
    icon: Shield,
    title: 'Third-Party Audits',
    desc: 'We undergo regular security audits and penetration testing. Our practices align with OWASP Top 10 and NIST cybersecurity frameworks.',
  },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        title="Enterprise-Grade Security"
        subtitle="Your data and privacy are our foundation. Every layer of DevConnect is built with security-first principles."
      />
      <div className="mx-auto max-w-5xl space-y-12 px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <Card key={item.title}>
              <CardContent className="pt-6">
                <item.icon className="mb-3 text-primary" size={28} />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold">Responsible Disclosure</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              If you discover a security vulnerability, please report it
              privately to{' '}
              <a
                href="mailto:security@devconnect.dev"
                className="text-primary underline"
              >
                security@devconnect.dev
              </a>
              . We appreciate responsible disclosure and will acknowledge valid
              reports within 72 hours.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
