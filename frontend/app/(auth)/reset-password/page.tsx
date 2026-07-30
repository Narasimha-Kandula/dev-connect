import type { Metadata } from 'next';
import ResetPasswordClient from './client';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your DevConnect account.',
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
