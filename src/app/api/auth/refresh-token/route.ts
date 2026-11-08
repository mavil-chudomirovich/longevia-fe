import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { BACKEND_URL } from '@/lib/env';
import {
  REFRESH_COOKIE,
  clearSessionCookies,
  readTokenPair,
  setSessionCookies,
} from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken)
    return NextResponse.json(
      { status: 401, title: 'Phiên đăng nhập đã hết hạn.' },
      { status: 401 }
    );
  try {
    const backend = await fetch(`${BACKEND_URL}${API_ENDPOINTS.IDENTITY.AUTH.REFRESH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const payload: unknown = await backend.json().catch(() => null);
    if (!backend.ok) {
      const response = NextResponse.json(payload, { status: backend.status });
      if (backend.status === 401) clearSessionCookies(response);
      return response;
    }
    const tokens = readTokenPair(payload);
    if (!tokens)
      return NextResponse.json(
        { status: 502, title: 'Phản hồi làm mới phiên không hợp lệ.' },
        { status: 502 }
      );
    const response = NextResponse.json({
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    });
    setSessionCookies(response, tokens);
    return response;
  } catch {
    return NextResponse.json(
      { status: 502, title: 'Không thể làm mới phiên đăng nhập.' },
      { status: 502 }
    );
  }
}
