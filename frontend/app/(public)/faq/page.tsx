import type { Metadata } from 'next';
import FAQClient from './client';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Find answers to common questions about DevConnect — account setup, security, billing, platform usage, and more.',
  openGraph: {
    title: 'FAQ — DevConnect',
    description:
      'Find answers to common questions about DevConnect — account setup, security, billing, platform usage, and more.',
  },
};

export default function FAQPage() {
  return <FAQClient />;
}
