import type { Metadata } from 'next';
import SignupClient from './client';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your DevConnect account and join a network of AI-vetted developers. Find your next tech co-founder today.',
  openGraph: {
    title: 'Sign Up — DevConnect',
    description: 'Create your DevConnect account and join a network of AI-vetted developers.',
  },
};

export default function SignupPage() {
  return <SignupClient />;
}
