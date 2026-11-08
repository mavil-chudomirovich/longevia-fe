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

  it('redirects a guest away from protected routes', () => {
    const response = middleware(new NextRequest('http://localhost:3000/progress'));

    expect(response.headers.get('location')).toBe('http://localhost:3000/login?from=%2Fprogress');
  });
});
