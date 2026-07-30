import type { Metadata } from 'next';
import SendVerificationClient from './client';

export const metadata: Metadata = {
  title: 'Resend Verification',
  description: 'Resend your DevConnect email verification link.',
  robots: { index: false },
};

export default function SendVerificationPage() {
  return <SendVerificationClient />;
}
