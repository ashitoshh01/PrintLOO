import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/signup', '/'];
const CUSTOMER_ROUTES = ['/upload', '/queue', '/orders'];
const SHOP_ROUTES = ['/shop'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith('/files'))) {
    return NextResponse.next();
  }

  // Check for token in cookies (set it there on login)
  const token = request.cookies.get('auth-token')?.value;

  if (!token && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.includes('favicon')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|files).*)'],
};
