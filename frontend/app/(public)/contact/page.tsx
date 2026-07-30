import type { Metadata } from 'next';
import ContactClient from './client';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the DevConnect team. Have a question, suggestion, or need help? We\'d love to hear from you.',
  openGraph: {
    title: 'Contact — DevConnect',
    description:
      'Get in touch with the DevConnect team. Have a question, suggestion, or need help? We\'d love to hear from you.',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
