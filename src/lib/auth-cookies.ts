import 'server-only';
import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, SESSION_HINT_COOKIE } from '@/common/constants/routes';

export { ACCESS_COOKIE, REFRESH_COOKIE };

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function readTokenPair(payload: unknown): TokenPair | null {
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as Record<string, unknown>;
  return typeof value.accessToken === 'string' &&
    typeof value.refreshToken === 'string' &&
    typeof value.expiresIn === 'number'
    ? {
        accessToken: value.accessToken,
        refreshToken: value.refreshToken,
        expiresIn: value.expiresIn,
      }
    : null;
}

export function setSessionCookies(response: NextResponse, tokens: TokenPair): void {
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60,
  });
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: tokens.expiresIn,
  });
  // The refresh secret is path-scoped, so pages need a non-secret session hint.
  // It is readable by JS on purpose: the client uses it to decide whether to try a
  // silent refresh even when the persisted user in localStorage is gone.
  response.cookies.set(SESSION_HINT_COOKIE, '1', {
    httpOnly: false,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 0,
  });
  response.cookies.set(ACCESS_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set(SESSION_HINT_COOKIE, '', {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
