import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { BACKEND_URL } from '@/lib/env';
import { clearSessionCookies } from '@/lib/auth-cookies';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('lv_rt')?.value;
  const authorization = request.headers.get('authorization');
  if (refreshToken && authorization) {
    await fetch(`${BACKEND_URL}${API_ENDPOINTS.IDENTITY.AUTH.LOGOUT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  }
  const response = NextResponse.json({ loggedOut: true });
  clearSessionCookies(response);
  return response;
}
