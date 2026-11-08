import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

describe('session middleware', () => {
  it('lets a refresh-cookie hint reach the client app after the access cookie expires', () => {
    const response = middleware(
      new NextRequest('http://localhost:3000/progress', {
        headers: { cookie: 'lv_session_hint=1' },
      })
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('does not bounce /login back to the app on a hint-only session (avoids redirect loop)', () => {
    const response = middleware(
      new NextRequest('http://localhost:3000/login', {
        headers: { cookie: 'lv_session_hint=1' },
      })
    );

    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects /login to /progress when the access cookie is still valid', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 }));
    const response = middleware(
      new NextRequest('http://localhost:3000/login', {
        headers: { cookie: `lv_at=h.${payload}.s; lv_session_hint=1` },
      })
    );

    expect(response.headers.get('location')).toBe('http://localhost:3000/progress');
  });

  it('redirects a guest away from protected routes', () => {
    const response = middleware(new NextRequest('http://localhost:3000/progress'));

    expect(response.headers.get('location')).toBe('http://localhost:3000/login?from=%2Fprogress');
  });
});
