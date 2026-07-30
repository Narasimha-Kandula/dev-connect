'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  discover: 'Discover',
  matches: 'Matches',
  projects: 'Projects',
  create: 'Create Project',
  chat: 'Messages',
  settings: 'Settings',
  profile: 'Profile',
  notifications: 'Notifications',
  skills: 'Skills',
  admin: 'Admin',
  analytics: 'Analytics',
  connections: 'Connections',
  invitations: 'Invitations',
  recommendations: 'Recommendations',
  portfolio: 'Portfolio',
  activity: 'Activity',
  saved: 'Saved',
  search: 'Search',
  events: 'Events',
  leaderboard: 'Leaderboard',
  achievements: 'Achievements',
  reports: 'Reports',
  referrals: 'Referrals',
  billing: 'Billing',
  security: 'Security',
  privacy: 'Privacy',
  support: 'Support',
  faq: 'FAQ',
  about: 'About',
  features: 'Features',
  'how-it-works': 'How It Works',
  usage: 'Usage',
  files: 'Files',
  calls: 'Calls',
  assistant: 'Assistant',
  insights: 'Insights',
  contacts: 'Contacts',
  blocked: 'Blocked',
  resume: 'Resume',
  safety: 'Safety',
  'terms-of-service': 'Terms',
  'cookie-policy': 'Cookies',
  contact: 'Contact',
  org: 'Organization',
  collab: 'Collaboration',
  demo: 'Demo',
  onboarding: 'Onboarding',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function labelFor(segment: string): string | null {
  if (UUID_RE.test(segment)) return null;
  if (LABELS[segment]) return LABELS[segment];
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  type Crumb = { label: string; href: string; isLast: boolean };
  const crumbs: Crumb[] = segments
    .map((seg, i) => {
      const label = labelFor(seg);
      if (label === null) return null;
      return { label, href: '/' + segments.slice(0, i + 1).join('/'), isLast: i === segments.length - 1 };
    })
    .filter((c): c is Crumb => c !== null);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground transition-colors">
        Home
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight size={12} className="shrink-0" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
