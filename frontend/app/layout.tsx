import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { Navbar } from '@/components/navbar';
import SubHeader from '@/components/sub-header';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevConnect — Find Your Next Tech Co-Founder',
  description:
    'Discover, match, and collaborate with AI-vetted developers in real-time. Build faster, launch stronger.',
  openGraph: {
    title: 'DevConnect — Find Your Next Tech Co-Founder',
    description: 'Discover, match, and collaborate with AI-vetted developers in real-time.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevConnect — Find Your Next Tech Co-Founder',
    description: 'Discover, match, and collaborate with AI-vetted developers in real-time.',
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
            <Link href="/demo" className="hover:text-foreground">Demo</Link>
            <Link href="/testimonials" className="hover:text-foreground">Testimonials</Link>
            <Link href="/faq" className="hover:text-foreground">FAQ</Link>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Company</p>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
            <Link href="/security" className="hover:text-foreground">Security</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookie Policy</Link>
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
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <SubHeader />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
