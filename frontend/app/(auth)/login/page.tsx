import type { Metadata } from 'next';
import LoginClient from './client';

export const metadata: Metadata = {
  title: 'Log In',
  description: 'Log in to your DevConnect account to find your next tech co-founder and collaborate with developers.',
  openGraph: {
    title: 'Log In — DevConnect',
    description: 'Log in to your DevConnect account to find your next tech co-founder.',
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
