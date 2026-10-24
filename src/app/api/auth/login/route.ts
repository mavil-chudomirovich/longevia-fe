import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/env';

/**
 * POST /api/auth/login
 * Proxy tới BE để forward Set-Cookie (accessToken + refreshToken HttpOnly)
 * về browser cho domain Next (localhost:3000), để middleware đọc được.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const cookieHeader = req.headers.get('cookie') ?? '';

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body,
    });
  } catch (err) {
    console.error('[login proxy] backend unreachable:', err);
    return NextResponse.json({ message: 'Không thể kết nối máy chủ.' }, { status: 502 });
  }

  const data = await backendRes.json().catch(() => ({}));
  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const response = NextResponse.json(data, { status: 200 });
  const headersWithCookies = backendRes.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookie: string[] =
    typeof headersWithCookies.getSetCookie === 'function'
      ? headersWithCookies.getSetCookie()
      : backendRes.headers.get('set-cookie')
        ? [backendRes.headers.get('set-cookie') as string]
        : [];
  for (const c of setCookie) {
    response.headers.append('set-cookie', c);
  }
  return response;
}
