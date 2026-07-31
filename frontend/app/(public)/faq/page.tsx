import type { Metadata } from 'next';
import FAQClient from './client';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Find answers to common questions about DevConnect — account setup, security, billing, platform usage, and more. Your developer collaboration questions answered.',
  openGraph: {
    title: 'FAQ',
    description:
      'Find answers to common questions about DevConnect — account setup, security, billing, platform usage, and more.',
  },
  alternates: { canonical: '/faq' },
};

export default function FAQPage() {
  return <FAQClient />;
}
