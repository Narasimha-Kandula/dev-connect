import type { Metadata } from 'next';
import { PageHero } from '@/components/public/page-hero';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the DevConnect platform.',
  alternates: { canonical: '/terms' },
  robots: { index: false, follow: true },
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing or using DevConnect, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.',
  },
  {
    title: '2. User Accounts',
    content:
      'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate, current information.',
  },
  {
    title: '3. Acceptable Use',
    content:
      'You agree not to misuse the platform for spam, harassment, impersonation, or any illegal activity. We reserve the right to suspend accounts that violate these standards.',
  },
  {
    title: '4. Intellectual Property',
    content:
      'Your profile content and project data remain yours. DevConnect claims no ownership over code, ideas, or projects shared on the platform.',
  },
  {
    title: '5. Privacy',
    content:
      'Your use of DevConnect is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal data.',
  },
  {
    title: '6. Limitation of Liability',
    content:
      'DevConnect is provided "as is" without warranties. We are not liable for damages arising from your use of the platform or interactions with other users.',
  },
  {
    title: '7. Termination',
    content:
      'We may suspend or terminate your account for violations of these terms. You may delete your account at any time through settings.',
  },
  {
    title: '8. Changes',
    content:
      'We may update these terms. Material changes will be notified via email or platform notice. Continued use after changes constitutes acceptance.',
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        title="Terms of Service"
        subtitle="Last updated: January 2026"
      />
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-16">
        <p className="text-sm text-muted-foreground leading-relaxed">
          These Terms of Service govern your use of the DevConnect platform. By
          creating an account or accessing the platform, you agree to these
          terms.
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
              href="mailto:support@devconnect.dev"
              className="text-primary underline"
            >
              support@devconnect.dev
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
