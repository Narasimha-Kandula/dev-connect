import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SECTIONS = [
  {
    title: 'Information We Collect',
    content: 'We collect information you provide directly: name, email, profile details, GitHub data, and communication content. We also automatically collect usage data including page views, interactions, and device information to improve our service.',
  },
  {
    title: 'How We Use Your Information',
    content: 'Your data powers the matching engine, personalizes recommendations, facilitates communication between matched users, and helps us improve platform features. We never sell your personal information to third parties.',
  },
  {
    title: 'Data Sharing',
    content: 'We share data only with your consent or as necessary to provide the service: with matched users (your profile), with service providers (hosting, analytics) bound by data processing agreements, and when required by law.',
  },
  {
    title: 'Your Rights',
    content: 'You have the right to access, correct, export, or delete your data. You can update your information in Settings at any time. For complete account deletion, contact support. We respond to all GDPR and CCPA requests within 30 days.',
  },
  {
    title: 'Data Retention',
    content: 'We retain your data for as long as your account is active. After account deletion, we delete or anonymize your data within 90 days, except where legal obligations require longer retention.',
  },
  {
    title: 'Cookies',
    content: 'We use essential cookies for authentication and security, analytics cookies to understand usage patterns, and functional cookies to remember preferences. You can manage cookie preferences in your browser settings.',
  },
  {
    title: 'Security',
    content: 'We implement industry-standard security measures including TLS 1.3 encryption, AES-256 at rest, regular security audits, and access controls. Details are available on our Security page.',
  },
  {
    title: 'Contact',
    content: 'For privacy-related inquiries, contact our Data Protection Officer at privacy@devconnect.dev or through our Contact page.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Your Data, Your Control.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 1, 2026</p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          At DevConnect, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.
        </p>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <Card key={s.title}>
            <CardHeader><CardTitle>{s.title}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
