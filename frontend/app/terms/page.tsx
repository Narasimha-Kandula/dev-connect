import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content: 'By creating an account or using DevConnect, you agree to these Terms of Service. If you do not agree, do not use the platform. We may update these terms; continued use after changes constitutes acceptance.',
  },
  {
    title: 'Account Responsibilities',
    content: 'You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately of unauthorized use. You must be at least 16 years old to use the platform.',
  },
  {
    title: 'Acceptable Use',
    content: 'You agree not to: misuse the platform for spam, harassment, or illegal activity; scrape user data without permission; impersonate others; or circumvent security measures. Violations may result in account suspension or termination.',
  },
  {
    title: 'Intellectual Property',
    content: 'You retain ownership of content you post. By posting, you grant DevConnect a license to display and process your content for platform functionality. Our trademarks, logos, and platform code are owned by DevConnect.',
  },
  {
    title: 'Third-Party Services',
    content: 'DevConnect integrates with GitHub, Google, and other third-party services. Your use of those services is governed by their terms. We are not responsible for third-party service disruptions or data handling.',
  },
  {
    title: 'Limitation of Liability',
    content: 'DevConnect is provided "as is" without warranties. We are not liable for indirect damages arising from platform use. Our total liability is limited to the amount you paid in the 12 months preceding the claim.',
  },
  {
    title: 'Termination',
    content: 'You may delete your account at any time. We may suspend or terminate accounts for terms violations. Upon termination, your data is handled per our Privacy Policy. Provisions regarding liability and IP survive termination.',
  },
  {
    title: 'Dispute Resolution',
    content: 'Disputes are governed by the laws of Delaware, USA. We encourage informal resolution first — contact us at support@devconnect.dev. If unresolved, disputes will be settled by binding arbitration in Delaware.',
  },
  {
    title: 'API Usage',
    content: 'API access is subject to rate limits and fair use policies. You may not use the API to replicate core platform functionality. We reserve the right to revoke API access for abuse or terms violations.',
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Terms of Service.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 1, 2026</p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Welcome to DevConnect. These terms govern your use of our platform and services.
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
