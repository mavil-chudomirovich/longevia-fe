import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_ROUTES, PROTECTED_PREFIXES, SESSION_HINT_COOKIE } from '@/common/constants/routes';

function isTokenExpired(token: string): boolean {
  try {
    const payload: unknown = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    if (!payload || typeof payload !== 'object' || !('exp' in payload)) return true;
    return typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000) + 10;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('lv_at')?.value;
  const hasSession = Boolean(
    (accessToken && !isTokenExpired(accessToken)) ||
    request.cookies.get(SESSION_HINT_COOKIE)?.value === '1'
  );

  if (
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname === '/onboarding'
  ) {
    if (!hasSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (AUTH_ROUTES.includes(pathname as (typeof AUTH_ROUTES)[number]) && hasSession) {
    return NextResponse.redirect(new URL('/progress', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/progress/:path*',
    '/diet/:path*',
    '/profile/:path*',
    '/onboarding',
    '/login',
    '/forgot-password',
    '/reset-password',
  ],
};
