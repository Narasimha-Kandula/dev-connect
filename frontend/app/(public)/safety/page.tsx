import type { Metadata } from 'next';
import SafetyClient from './client';

export const metadata: Metadata = {
  title: 'Safety & Community Guidelines',
  description:
    'DevConnect is built on trust. Review our community guidelines to ensure every member feels safe, respected, and empowered to collaborate. Learn about reporting and safety tools.',
  openGraph: {
    title: 'Safety & Community Guidelines',
    description:
      'DevConnect is built on trust. Review our community guidelines to ensure every member feels safe, respected, and empowered to collaborate.',
  },
  alternates: { canonical: '/safety' },
};

export default function SafetyPage() {
  return <SafetyClient />;
}
