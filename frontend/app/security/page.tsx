import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, FileCheck, Eye, Server, AlertTriangle } from 'lucide-react';

const ITEMS = [
  {
    icon: Lock,
    title: 'Encryption in Transit & At Rest',
    desc: 'All data transmitted between your browser and our servers is encrypted using TLS 1.3. Data at rest is encrypted with AES-256 using industry-standard key management practices.',
  },
  {
    icon: Shield,
    title: 'Access Control & Authentication',
    desc: 'Multi-factor authentication is available for all accounts. Role-based access control (RBAC) ensures users only access data they are authorized to see. OAuth providers are validated via PKCE flow.',
  },
  {
    icon: FileCheck,
    title: 'Compliance & Certifications',
    desc: 'We are SOC 2 Type II compliant and GDPR-ready. Our data processing agreements (DPA) are available for enterprise customers. Regular third-party penetration tests validate our security posture.',
  },
  {
    icon: Eye,
    title: 'Vulnerability Disclosure Program',
    desc: 'We welcome responsible security research. Report vulnerabilities to security@devconnect.dev. We commit to acknowledging reports within 48 hours and providing updates throughout the remediation process.',
  },
  {
    icon: Server,
    title: 'Infrastructure Security',
    desc: 'Our infrastructure runs on isolated, monitored environments. Network segmentation, intrusion detection, and automated threat response are in place. All deployments go through code review and automated security scanning.',
  },
  {
    icon: AlertTriangle,
    title: 'Incident Response',
    desc: 'We maintain a documented incident response plan with clear escalation paths. In the event of a security incident, affected users are notified within 72 hours per regulatory requirements.',
  },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Security at Every Layer.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
          We embed security into every part of our platform — from code to deployment to daily operations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <Card key={item.title}>
            <CardContent className="pt-6">
              <item.icon className="mb-3 text-primary" size={24} />
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Report a security issue:{' '}
            <a href="mailto:security@devconnect.dev" className="text-foreground underline">security@devconnect.dev</a>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PGP key available on request. We follow coordinated disclosure guidelines.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
