'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { useRef, useState, useEffect } from 'react';
import {
  Menu, X, LogOut, LayoutDashboard, Bell, User, Settings,
  Plus, SwitchCamera, Trash2, Bookmark, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar } from '@/lib/avatar';

function NavSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden h-9 w-9 animate-pulse rounded-full bg-muted sm:block" />
      <div className="hidden h-9 w-20 animate-pulse rounded-lg bg-muted sm:block" />
      <div className="gradient-brand hidden h-9 w-36 animate-pulse rounded-lg opacity-50 sm:block" />
    </div>
  );
}

function NavAuthenticated({ user, onLogout, unreadCount }: { user: NonNullable<ReturnType<typeof useAuth>['user']>; onLogout: () => void; unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const accounts = useAuthStore((s) => s.accounts);
  const switchAccount = useAuthStore((s) => s.switchAccount);
  const removeAccount = useAuthStore((s) => s.removeAccount);
  const addAccountAction = useAuthStore((s) => s.addAccount);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="hidden items-center gap-3 sm:flex">
      <Link href="/notifications" className="relative text-muted-foreground hover:text-foreground">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        <LayoutDashboard size={18} />
      </Link>

      <div className="relative" ref={menuRef}>
        <button onClick={() => setOpen(!open)} className="block" aria-label="User menu" aria-expanded={open} aria-haspopup="true">
          <Avatar src={user.profile?.avatarUrl} name={user.profile?.displayName ?? user.email} size="sm" />
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-card shadow-xl py-2 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-semibold truncate">{user.profile?.displayName || user.email}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>

              <Link href="/profile" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors">
                <User size={16} /> View Profile
              </Link>
              <Link href="/settings" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors">
                <Settings size={16} /> Settings
              </Link>

              {accounts.length > 1 && (
                <>
                  <hr className="border-border my-1" />
                  <p className="px-4 py-1 text-xs text-muted-foreground">Switch Account</p>
                  {accounts.filter((a) => a.accessToken !== useAuthStore.getState().token).map((a) => (
                    <button key={a.id} onClick={() => { switchAccount(a.accessToken); setOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/30 transition-colors text-left">
                      <SwitchCamera size={14} />
                      <span className="truncate">{a.displayName || a.email}</span>
                    </button>
                  ))}
                </>
              )}

              <hr className="border-border my-1" />

              <button onClick={() => { setShowAddAccount(true); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors">
                <Plus size={16} /> Add Another Account
              </button>

              <hr className="border-border my-1" />

              <button onClick={() => { onLogout(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors text-danger">
                <LogOut size={16} /> Logout
              </button>
            </div>
        )}

        {showAddAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddAccount(false)}>
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold">Add Another Account</h3>
              <input
                value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                placeholder="Email" type="email"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={addPassword} onChange={(e) => setAddPassword(e.target.value)}
                placeholder="Password" type="password"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowAddAccount(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/30 transition-colors">
                  Cancel
                </button>
                <button onClick={async () => {
                  try {
                    await addAccountAction(addEmail, addPassword);
                    setShowAddAccount(false);
                    setAddEmail('');
                    setAddPassword('');
                  } catch {}
                }}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
  const { unreadCount } = useNotificationSocket();
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
              <Link href="/invitations" className="transition-colors hover:text-foreground">Invitations</Link>
              <Link href="/projects" className="transition-colors hover:text-foreground">Projects</Link>
              <Link href="/chat" className="transition-colors hover:text-foreground">Messages</Link>
              <Link href="/bookmarks" className="transition-colors hover:text-foreground">Bookmarks</Link>
              <Link href="/recommendations" className="transition-colors hover:text-foreground">AI Picks</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!initialized || loading ? (
            <NavSkeleton />
          ) : isAuthenticated && user ? (
            <NavAuthenticated user={user} onLogout={handleLogout} unreadCount={unreadCount} />
          ) : (
            <NavUnauthenticated />
          )}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-border bg-background px-6 py-4 md:hidden" role="navigation" aria-label="Mobile navigation">
          <nav className="flex flex-col gap-3 text-sm font-medium text-muted-foreground">
            <Link href="/features" onClick={() => setMobileOpen(false)}>Features</Link>
            <Link href="/how-it-works" onClick={() => setMobileOpen(false)}>How It Works</Link>
            {initialized && isAuthenticated && (
              <>
                <Link href="/discover" onClick={() => setMobileOpen(false)}>Discover</Link>
                <Link href="/matches" onClick={() => setMobileOpen(false)}>Matches</Link>
                <Link href="/invitations" onClick={() => setMobileOpen(false)}>Invitations</Link>
                <Link href="/projects" onClick={() => setMobileOpen(false)}>Projects</Link>
                <Link href="/chat" onClick={() => setMobileOpen(false)}>Messages</Link>
                <Link href="/bookmarks" onClick={() => setMobileOpen(false)}>Bookmarks</Link>
                <Link href="/recommendations" onClick={() => setMobileOpen(false)}>AI Picks</Link>
              </>
            )}
            <hr className="border-border" />
            {!initialized || loading ? null : isAuthenticated ? (
              <>
                <Link href="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
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
