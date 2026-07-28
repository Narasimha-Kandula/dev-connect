'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { useState } from 'react';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function NavSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden h-9 w-9 animate-pulse rounded-full bg-muted sm:block" />
      <div className="hidden h-9 w-20 animate-pulse rounded-lg bg-muted sm:block" />
      <div className="gradient-brand hidden h-9 w-36 animate-pulse rounded-lg opacity-50 sm:block" />
    </div>
  );
}

function NavAuthenticated({ user, onLogout }: { user: NonNullable<ReturnType<typeof useAuth>['user']>; onLogout: () => void }) {
  return (
    <div className="hidden items-center gap-3 sm:flex">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        <LayoutDashboard size={18} />
      </Link>
      <Link
        href="/profile"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
      >
        {(user.profile?.displayName?.[0] ?? user.email[0]).toUpperCase()}
      </Link>
      <button onClick={onLogout} className="text-sm text-muted-foreground hover:text-foreground">
        <LogOut size={16} />
      </button>
    </div>
  );
}

function NavUnauthenticated() {
  return (
    <div className="hidden items-center gap-3 sm:flex">
      <Link
        href="/login"
        className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="gradient-brand rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
      >
        Get Started Free
      </Link>
    </div>
  );
}

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, initialized, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="gradient-brand h-7 w-7 rounded-lg" />
          DevConnect
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/features" className="transition-colors hover:text-foreground">Features</Link>
          <Link href="/how-it-works" className="transition-colors hover:text-foreground">How It Works</Link>
          {initialized && isAuthenticated && (
            <>
              <Link href="/discover" className="transition-colors hover:text-foreground">Discover</Link>
              <Link href="/matches" className="transition-colors hover:text-foreground">Matches</Link>
              <Link href="/projects" className="transition-colors hover:text-foreground">Projects</Link>
              <Link href="/chat" className="transition-colors hover:text-foreground">Messages</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!initialized || loading ? (
            <NavSkeleton />
          ) : isAuthenticated && user ? (
            <NavAuthenticated user={user} onLogout={handleLogout} />
          ) : (
            <NavUnauthenticated />
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-muted-foreground">
            <Link href="/features" onClick={() => setMobileOpen(false)}>Features</Link>
            <Link href="/how-it-works" onClick={() => setMobileOpen(false)}>How It Works</Link>
            {initialized && isAuthenticated && (
              <>
                <Link href="/discover" onClick={() => setMobileOpen(false)}>Discover</Link>
                <Link href="/matches" onClick={() => setMobileOpen(false)}>Matches</Link>
                <Link href="/projects" onClick={() => setMobileOpen(false)}>Projects</Link>
                <Link href="/chat" onClick={() => setMobileOpen(false)}>Messages</Link>
              </>
            )}
            <hr className="border-border" />
            {!initialized || loading ? null : isAuthenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="text-left text-muted-foreground hover:text-foreground">Log out</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="gradient-brand rounded-lg px-3 py-2 text-center font-semibold text-white">Get Started Free</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
