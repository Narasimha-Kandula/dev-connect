import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { NotificationProvider } from '@/components/notification-provider';
import { Navbar } from '@/components/navbar';
import { Toaster } from 'sonner';
import { OfflineIndicator } from '@/components/offline-indicator';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://devconnect.dev'),
  title: {
    default: 'DevConnect — Find Your Next Tech Co-Founder',
    template: '%s — DevConnect',
  },
  description:
    'Discover, match, and collaborate with AI-vetted developers in real-time. Build faster, launch stronger.',
  openGraph: {
    title: 'DevConnect — Find Your Next Tech Co-Founder',
    description: 'Discover, match, and collaborate with AI-vetted developers in real-time.',
    url: 'https://devconnect.dev',
    siteName: 'DevConnect',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevConnect — Find Your Next Tech Co-Founder',
    description: 'Discover, match, and collaborate with AI-vetted developers in real-time.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-4">
        <div>
          <p className="mb-3 text-sm font-bold">DevConnect</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Find your next tech co-founder and build something great.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Platform</p>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <Link href="/features" className="hover:text-foreground">Features</Link>
            <Link href="/how-it-works" className="hover:text-foreground">How It Works</Link>
            <Link href="/faq" className="hover:text-foreground">FAQ</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Company</p>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
            <Link href="/safety" className="hover:text-foreground">Safety</Link>
            <Link href="/security" className="hover:text-foreground">Security</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Connect</p>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">Log in</Link>
            <Link href="/signup" className="hover:text-foreground">Sign up</Link>
            <a href="mailto:support@devconnect.dev" className="hover:text-foreground">support@devconnect.dev</a>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} DevConnect. All rights reserved.
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <Navbar />
              <OfflineIndicator />
              <main id="main-content" className="min-h-screen outline-none" tabIndex={-1}>
                {children}
              </main>
              <Footer />
              <Toaster richColors position="top-right" />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
