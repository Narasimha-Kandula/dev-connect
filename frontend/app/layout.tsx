import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { NotificationProvider } from '@/components/notification-provider';
import { Navbar } from '@/components/navbar';
import { Toaster } from 'sonner';
import { OfflineIndicator } from '@/components/offline-indicator';
import { OrganizationSchema, WebApplicationSchema, ProductSchema } from '@/lib/seo/json-ld';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f5fa' },
    { media: '(prefers-color-scheme: dark)', color: '#181622' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://devconnect.dev'),
  title: {
    default: 'DevConnect — Find Your Next Tech Co-Founder',
    template: '%s — DevConnect',
  },
  description:
    'Discover, match, and collaborate with AI-vetted developers in real-time. The #1 developer collaboration platform for finding your next tech co-founder.',
  keywords: [
    'developer collaboration platform',
    'find developers to collaborate',
    'developer matching platform',
    'tech co-founder',
    'dev tinder',
    'open source developer network',
    'developer networking',
    'AI developer matching',
    'find coding partner',
    'software developer matching',
  ].join(', '),
  openGraph: {
    title: 'DevConnect — Find Your Next Tech Co-Founder',
    description: 'Discover, match, and collaborate with AI-vetted developers in real-time. Build faster, launch stronger.',
    url: 'https://devconnect.dev',
    siteName: 'DevConnect',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://devconnect.dev/og-default.png',
        width: 1200,
        height: 630,
        alt: 'DevConnect — Developer Collaboration Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevConnect — Find Your Next Tech Co-Founder',
    description: 'Discover, match, and collaborate with AI-vetted developers in real-time.',
    images: ['https://devconnect.dev/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION', // Replace with actual code
  },
  category: 'technology',
  classification: 'Developer Collaboration Platform',
  other: {
    'google-site-verification': 'YOUR_GOOGLE_VERIFICATION',
  },
};

const BASE_URL = 'https://devconnect.dev';

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-4">
        <div>
          <Link href="/" className="mb-3 block text-sm font-bold hover:text-primary transition-colors">DevConnect</Link>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Find your next tech co-founder and build something great. The AI-powered developer collaboration platform.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Platform</p>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link href="/developers" className="hover:text-foreground transition-colors">Discover Developers</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Company</p>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            <Link href="/safety" className="hover:text-foreground transition-colors">Safety</Link>
            <Link href="/security" className="hover:text-foreground transition-colors">Security</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Connect</p>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
            <a href="mailto:support@devconnect.dev" className="hover:text-foreground transition-colors">support@devconnect.dev</a>
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
      <head>
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />
        <link rel="preconnect" href="https://ui-avatars.com" />
        <link rel="dns-prefetch" href="https://avatars.githubusercontent.com" />
        <link rel="dns-prefetch" href="https://ui-avatars.com" />

        {/* JSON-LD Structured Data */}
        <OrganizationSchema />
        <WebApplicationSchema />
        <ProductSchema />
      </head>
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
