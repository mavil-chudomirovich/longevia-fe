import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/env';

/**
 * POST /api/auth/refresh-token
 * Proxy tới Backend để đổi refreshToken (HttpOnly cookie) lấy accessToken mới.
 * Lý do cần proxy: browser tự gửi HttpOnly cookie cùng-domain,
 * FE không bao giờ đọc refreshToken bằng JS.
 */
export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  // Contract backend hiện tại: `POST /auth/refresh` (READY từ 2026-09-15).
  // Giữ `/auth/refresh-token` làm fallback khi BE cũ trả 404.
  const candidates = ['/auth/refresh', '/auth/refresh-token'];

  let lastError: unknown = null;

  for (const path of candidates) {
    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward toàn bộ cookie (chứa refreshToken HttpOnly) tới BE
          cookie: cookieHeader,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 404 = BE dùng tên endpoint còn lại -> thử candidate tiếp theo
        if (res.status === 404) {
          lastError = data;
          continue;
        }
        // Forward Set-Cookie ngay cả khi lỗi (backend clear cookie khi REUSED/EXPIRED)
        const errorResponse = NextResponse.json(data, { status: res.status });
        const headersWithCookiesErr = res.headers as Headers & {
          getSetCookie?: () => string[];
        };
        const setCookieErr: string[] =
          typeof headersWithCookiesErr.getSetCookie === 'function'
            ? headersWithCookiesErr.getSetCookie()
            : res.headers.get('set-cookie')
              ? [res.headers.get('set-cookie') as string]
              : [];
        for (const c of setCookieErr) {
          errorResponse.headers.append('set-cookie', c);
        }
        return errorResponse;
      }

      const response = NextResponse.json(data);

      // Forward Set-Cookie từ BE (refresh rotation) về browser.
      // `getSetCookie()` chỉ có ở Node runtime mới — kiểm tra an toàn qua type guard, không `any`.
      const headersWithCookies = res.headers as Headers & {
        getSetCookie?: () => string[];
      };
      const setCookie: string[] =
        typeof headersWithCookies.getSetCookie === 'function'
          ? headersWithCookies.getSetCookie()
          : res.headers.get('set-cookie')
            ? [res.headers.get('set-cookie') as string]
            : [];

      for (const c of setCookie) {
        response.headers.append('set-cookie', c);
      }

      return response;
    } catch (err) {
      lastError = err;
    }
  }

  // BE chưa chạy -> trả 502 để axios interceptor hiểu là refresh thất bại
  // và chuyển về logout, thay vì treo queue.
  console.error('[refresh-token proxy] backend unreachable:', lastError);
  return NextResponse.json({ message: 'Không thể làm mới phiên đăng nhập.' }, { status: 502 });
}
