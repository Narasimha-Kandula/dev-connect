import type { Metadata } from 'next';
import SafetyClient from './client';

export const metadata: Metadata = {
  title: 'Community Safety & Guidelines',
  description:
    'DevConnect is built on trust. Review our community guidelines to ensure every member feels safe, respected, and empowered to collaborate.',
  openGraph: {
    title: 'Community Safety & Guidelines — DevConnect',
    description:
      'DevConnect is built on trust. Review our community guidelines to ensure every member feels safe, respected, and empowered to collaborate.',
  },
};

export default function SafetyPage() {
  return <SafetyClient />;
}
