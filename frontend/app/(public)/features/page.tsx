import type { Metadata } from 'next';
import FeaturesClient from './client';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'AI-powered developer matching, real-time collaboration workspace, smart profiles with GitHub auto-import, and enterprise-grade team controls.',
  openGraph: {
    title: 'Features — DevConnect',
    description:
      'AI-powered developer matching, real-time collaboration workspace, smart profiles with GitHub auto-import, and enterprise-grade team controls.',
  },
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
