import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/env';

/**
 * POST /api/auth/logout
 * Proxy logout + xóa cookie phía Next để middleware hết cho qua.
 */
export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';

  // Nhận scope từ client: `{ allDevices?: boolean }` (LogoutRequest của BE).
  let allDevices = false;
  try {
    const body = (await req.json()) as { allDevices?: unknown };
    allDevices = body?.allDevices === true;
  } catch {
    /* không body hoặc body sai định dạng -> mặc định CURRENT */
  }

  try {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({ allDevices }),
    }).catch(() => null);
  } catch {
    /* BE down vẫn cho logout phía client */
  }

  // Idempotent: luôn 200 + xóa cookie phía Next để middleware hết cho qua,
  // kể cả khi BE không phản hồi.
  const res = NextResponse.json({ message: 'Đã đăng xuất' });
  res.cookies.delete('accessToken');
  res.cookies.delete('access_token');
  res.cookies.delete('refreshToken');
  res.cookies.delete('refresh_token');
  return res;
}
