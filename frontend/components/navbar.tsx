import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="gradient-brand h-7 w-7 rounded-lg" />
          DevConnect
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/features" className="hover:text-foreground">Features</Link>
          <Link href="/how-it-works" className="hover:text-foreground">How It Works</Link>
          <Link href="/projects" className="hover:text-foreground">Projects</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted sm:inline-block"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="gradient-brand rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Start Building Free
          </Link>
        </div>
      </div>
    </header>
  );
}
