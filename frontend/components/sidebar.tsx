'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import {
  LayoutDashboard, Compass, Heart, MessageCircle, FolderKanban, Mail,
  Bell, Bookmark, Sparkles, User, Settings, ChevronLeft, PanelLeftClose, PanelLeft, X,
} from 'lucide-react';
import { Avatar } from '@/lib/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useBreakpoint } from '@/hooks/useMediaQuery';

interface NavItem { href: string; label: string; icon: typeof LayoutDashboard }

const NAV_GROUPS: { section: string; items: NavItem[] }[] = [
  { section: 'Main', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/matches', label: 'Matches', icon: Heart },
    { href: '/chat', label: 'Messages', icon: MessageCircle },
  ]},
  { section: 'Work', items: [
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/invitations', label: 'Invitations', icon: Mail },
  ]},
  { section: 'Social', items: [
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { href: '/recommendations', label: 'AI Picks', icon: Sparkles },
  ]},
  { section: 'Account', items: [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isTablet = useBreakpoint('tablet');
  const effectiveCollapsed = isTablet ? true : collapsed;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (mobileOpen && overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    if (mobileOpen) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const desktopWidth = effectiveCollapsed ? 'lg:w-16' : 'lg:w-60';

  function NavLink({ item, collapsed: col }: { item: NavItem; collapsed: boolean }) {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
        } ${col ? 'justify-center px-0' : ''}`}
        aria-current={active ? 'page' : undefined}
        title={col ? item.label : undefined}
      >
        <item.icon size={18} className="shrink-0" />
        {!col && <span>{item.label}</span>}
      </Link>
    );
  }

  const sidebarContent = (
    <div className={`flex h-full flex-col ${effectiveCollapsed ? 'w-16' : 'w-60'} transition-all duration-200`}>
      <div className="flex items-center border-b border-border px-3 py-3">
        {!effectiveCollapsed && (
          <span className="flex-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            Navigation
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors lg:block"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeftClose size={16} />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Sidebar navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.section} className="mb-4">
            {!effectiveCollapsed && (
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                {group.section}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} collapsed={effectiveCollapsed} />
            ))}
          </div>
        ))}
      </nav>

      {!effectiveCollapsed && (
        <div className="border-t border-border p-3">
          <Link href="/profile" className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted/20 transition-colors" aria-label="View your profile">
            <Avatar src={user?.profile?.avatarUrl} name={user?.profile?.displayName ?? user?.email ?? 'User'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user?.profile?.displayName ?? 'User'}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div
            ref={overlayRef}
            className="fixed left-0 top-0 h-full w-60 border-r border-border bg-background shadow-xl animate-in slide-in-from-left"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Mobile trigger FAB */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover transition-colors lg:hidden"
        aria-label="Open navigation menu"
      >
        <PanelLeft size={20} />
      </button>

      {/* Desktop sidebar */}
      <aside
        className={`hidden w-60 shrink-0 border-r border-border bg-background transition-all duration-200 lg:block ${desktopWidth}`}
        aria-label="Sidebar"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
