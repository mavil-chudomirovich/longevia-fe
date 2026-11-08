import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { NextResponse } from 'next/server';
import { SESSION_HINT_COOKIE } from '@/common/constants/routes';
import { clearSessionCookies, setSessionCookies } from '@/lib/auth-cookies';

describe('auth session cookies', () => {
  it('keeps the refresh secret scoped to auth and exposes only a non-secret route hint', () => {
    const response = NextResponse.next();
    setSessionCookies(response, { accessToken: 'access', refreshToken: 'refresh', expiresIn: 900 });

    expect(response.cookies.get('lv_rt')).toMatchObject({
      value: 'refresh',
      path: '/api/auth',
      httpOnly: true,
    });
    expect(response.cookies.get('lv_at')).toMatchObject({
      value: 'access',
      path: '/',
      httpOnly: true,
    });
    expect(response.cookies.get(SESSION_HINT_COOKIE)).toMatchObject({
      value: '1',
      path: '/',
      httpOnly: false,
    });
  });

  it('clears the route hint with the auth cookies on logout', () => {
    const response = NextResponse.next();
    clearSessionCookies(response);

    expect(response.cookies.get('lv_rt')).toMatchObject({ value: '', path: '/api/auth' });
    expect(response.cookies.get('lv_at')).toMatchObject({ value: '', path: '/' });
    expect(response.cookies.get(SESSION_HINT_COOKIE)).toMatchObject({ value: '', path: '/' });
  });
});
