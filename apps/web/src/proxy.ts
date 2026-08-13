import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and static files
  if (
    PUBLIC_ROUTES.some((route) => pathname === route) ||
    pathname.startsWith('/files') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('favicon') ||
    pathname.includes('manifest') ||
    pathname.includes('apple-touch-icon') ||
    pathname.includes('android-chrome') ||
    pathname.includes('icon-')
  ) {
    return NextResponse.next();
  }

  // Check for auth token in cookies (set on login)
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|apple-touch-icon|android-chrome|files).*)'],
};
