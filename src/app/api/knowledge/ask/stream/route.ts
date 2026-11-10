import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function backendOrigin(): string {
  const raw =
    process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
  return raw.replace(/\/api(\/v1)?\/?$/, '');
}

/**
 * BFF proxy cho SSE hỏi sách: token nằm trong cookie HttpOnly nên browser không
 * tự gửi Bearer được. Route handler đọc `lv_at`, mở stream tới Diet và chuyển
 * nguyên `ReadableStream` về client (không buffer để giữ từng token).
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('lv_at')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { code: 'auth.unauthorized', detail: 'Bạn cần đăng nhập để hỏi sách.' },
      { status: 401 }
    );
  }

  const body = await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(`${backendOrigin()}/api/diet/knowledge/ask/stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
        accept: 'text/event-stream',
      },
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { code: 'network.unreachable', detail: 'Không kết nối được máy chủ. Bạn thử lại nhé.' },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-store, no-transform',
      'x-accel-buffering': 'no',
      connection: 'keep-alive',
    },
  });
}
