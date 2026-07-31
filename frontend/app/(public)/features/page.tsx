import type { Metadata } from 'next';
import FeaturesClient from './client';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'AI-powered developer matching, real-time collaboration workspace, smart profiles with GitHub auto-import, and enterprise-grade team controls. The complete developer collaboration platform.',
  openGraph: {
    title: 'Features',
    description:
      'AI-powered developer matching, real-time collaboration workspace, smart profiles with GitHub auto-import, and enterprise-grade team controls.',
  },
  alternates: { canonical: '/features' },
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
