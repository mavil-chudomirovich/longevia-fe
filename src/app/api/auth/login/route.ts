import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { BACKEND_URL } from '@/lib/env';
import { readTokenPair, setSessionCookies } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    const backend = await fetch(`${BACKEND_URL}${API_ENDPOINTS.IDENTITY.AUTH.LOGIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await request.text(),
    });
    const payload: unknown = await backend.json().catch(() => null);
    if (!backend.ok) return NextResponse.json(payload, { status: backend.status });
    const tokens = readTokenPair(payload);
    if (!tokens)
      return NextResponse.json({ title: 'Phản hồi đăng nhập không hợp lệ.' }, { status: 502 });
    const response = NextResponse.json({
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    });
    setSessionCookies(response, tokens);
    return response;
  } catch {
    return NextResponse.json({ status: 502, title: 'Không thể kết nối máy chủ.' }, { status: 502 });
  }
}
