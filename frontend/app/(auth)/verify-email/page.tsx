import type { Metadata } from 'next';
import VerifyEmailClient from './client';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your DevConnect email address to activate your account.',
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return <VerifyEmailClient />;
}
