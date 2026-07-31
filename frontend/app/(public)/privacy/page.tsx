import type { Metadata } from 'next';
import { PageHero } from '@/components/public/page-hero';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How DevConnect collects, uses, and protects your personal data. Your privacy matters.',
  alternates: { canonical: '/privacy' },
  robots: { index: false, follow: true },
};

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content:
      'We collect information you provide directly: name, email, profile data, GitHub repositories, and communication content. We also collect usage data: pages visited, features used, and interaction metrics.',
  },
  {
    title: '2. How We Use Your Data',
    content:
      'Your data powers the matching engine, facilitates communication between users, and helps us improve the platform. We never sell your personal data to third parties.',
  },
  {
    title: '3. Cookies',
    content:
      'We use essential cookies for authentication and session management. Optional analytics cookies help us understand usage patterns. You can control cookie preferences in your browser settings.',
  },
  {
    title: '4. Data Sharing',
    content:
      'Profile information you mark as public is visible to other users. We do not share your data with third parties except as required by law or with your explicit consent.',
  },
  {
    title: '5. Data Security',
    content:
      'All traffic is encrypted with TLS 1.3. Data at rest is encrypted with AES-256. We follow OWASP security guidelines and conduct regular security audits.',
  },
  {
    title: '6. Your Rights',
    content:
      'You can access, modify, or delete your data at any time through account settings. You can export your data upon request. Account deletion removes all personal data within 30 days.',
  },
  {
    title: '7. Third-Party Services',
    content:
      'DevConnect integrates with GitHub, Google, and other services you authorize. These services have their own privacy policies governing data they collect.',
  },
  {
    title: '8. Contact',
    content:
      'For privacy-related inquiries, contact us at privacy@devconnect.dev. We respond to all requests within 30 days.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title="Privacy Policy"
        subtitle="Last updated: January 2026"
      />
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-16">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your privacy matters to us. This policy explains how DevConnect
          collects, uses, and protects your personal data when you use our
          platform.
        </p>
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        ))}
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <p>
            Questions? Contact us at{' '}
            <a
              href="mailto:privacy@devconnect.dev"
              className="text-primary underline"
            >
              privacy@devconnect.dev
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
