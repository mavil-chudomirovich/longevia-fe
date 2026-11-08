import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { BACKEND_URL } from '@/lib/env';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  readTokenPair,
} from '@/lib/auth-cookies';

async function backendLogout(accessToken: string, refreshToken: string): Promise<number> {
  const res = await fetch(`${BACKEND_URL}${API_ENDPOINTS.IDENTITY.AUTH.LOGOUT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ refreshToken }),
  });
  return res.status;
}

/**
 * BE logout cần Bearer còn hạn. Nếu access token đã hết hạn (hoặc không có),
 * xoay refresh token để lấy cặp mới rồi revoke cặp đó — đảm bảo refresh token
 * luôn bị thu hồi phía server, không chỉ xoá cookie.
 */
async function revokeSession(accessToken: string | null, refreshToken: string): Promise<void> {
  if (accessToken) {
    const status = await backendLogout(accessToken, refreshToken);
    if (status !== 401) return;
  }
  const refreshed = await fetch(`${BACKEND_URL}${API_ENDPOINTS.IDENTITY.AUTH.REFRESH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!refreshed.ok) return;
  const pair = readTokenPair(await refreshed.json().catch(() => null));
  if (pair) await backendLogout(pair.accessToken, pair.refreshToken);
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const bearer = request.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')
    .trim();
  const accessToken = bearer || request.cookies.get(ACCESS_COOKIE)?.value || null;
  if (refreshToken) {
    await revokeSession(accessToken, refreshToken).catch(() => null);
  }
  const response = NextResponse.json({ loggedOut: true });
  clearSessionCookies(response);
  return response;
}
