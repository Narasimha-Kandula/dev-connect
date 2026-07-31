import type { Metadata } from 'next';
import ContactClient from './client';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the DevConnect team. Have a question, suggestion, or need help? We\'d love to hear from you. Support, partnerships, and general inquiries.',
  openGraph: {
    title: 'Contact Us',
    description:
      'Get in touch with the DevConnect team. Have a question, suggestion, or need help? We\'d love to hear from you.',
  },
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return <ContactClient />;
}
