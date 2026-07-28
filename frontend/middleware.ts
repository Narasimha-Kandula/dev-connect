import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = new Set([
  '/', '/login', '/signup', '/forgot-password', '/reset-password',
  '/features', '/how-it-works', '/about', '/faq', '/testimonials',
  '/contact', '/demo', '/privacy', '/terms', '/cookies', '/security',
  '/auth/callback', '/auth/google/callback',
]);

const authRoutes = new Set(['/login', '/signup', '/forgot-password', '/reset-password']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value
    ?? request.headers.get('authorization')?.replace('Bearer ', '')
    ?? '';

  const isPublic = publicRoutes.has(pathname)
    || pathname.startsWith('/_next')
    || pathname.startsWith('/api')
    || pathname.startsWith('/favicon')
    || pathname.startsWith('/images');

  const isAuthPage = authRoutes.has(pathname);

  if (isPublic) {
    if (isAuthPage && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
