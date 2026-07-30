import type { Metadata } from 'next';
import ForgotPasswordClient from './client';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your DevConnect account password. Enter your email to receive a password reset link.',
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
