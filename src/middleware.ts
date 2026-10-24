import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp <= currentTime + 10;
}

function getTokenRole(token: string): string | null {
  const payload = parseJwt(token) as {
    role?: unknown;
    user_role?: unknown;
    roles?: unknown;
  } | null;
  if (!payload) return null;
  const raw =
    payload.role ?? payload.user_role ?? (Array.isArray(payload.roles) ? payload.roles[0] : null);
  return typeof raw === 'string' ? raw.toUpperCase() : null;
}

/** Role được phép vào /admin/*. Token không có claim role -> cho qua, AuthGuard client chặn tiếp. */
const ADMIN_ROLES = ['ADMIN'];

/** Role được phép vào /contributor/*. */
const CONTRIBUTOR_ROLES = ['CONTRIBUTOR', 'ADMIN'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // BE set HttpOnly cookie sau login (proxy /api/v1 giữ cùng-domain).
  // Chấp nhận cả 2 tên để tương thích BE cũ/mới: accessToken | access_token
  const accessToken =
    request.cookies.get('accessToken')?.value ?? request.cookies.get('access_token')?.value;

  // Ví dụ bảo vệ route dashboard:
  const isProtectedPath = pathname.startsWith('/dashboard') || pathname.startsWith('/profile');
  const isAdminPath = pathname.startsWith('/admin');
  const isContributorPath = pathname.startsWith('/contributor');

  if (isProtectedPath) {
    if (!accessToken || isTokenExpired(accessToken)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Route /admin/*: cần token hợp lệ + role ADMIN (đọc từ JWT payload).
  if (isAdminPath) {
    if (!accessToken || isTokenExpired(accessToken)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const role = getTokenRole(accessToken);
    if (role && !ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Route /contributor/*: cần token hợp lệ + role CONTRIBUTOR hoặc ADMIN.
  if (isContributorPath) {
    if (!accessToken || isTokenExpired(accessToken)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const role = getTokenRole(accessToken);
    if (role && !CONTRIBUTOR_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Đã login rồi thì không cho quay lại /login nữa
  if (pathname === '/login' && accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/contributor/:path*',
    '/login',
  ],
};
