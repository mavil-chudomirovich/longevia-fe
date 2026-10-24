import { cookies } from 'next/headers';
import { BACKEND_URL, isDev } from './env';

function getBackendUrl(): string {
  // Bỏ quote thừa + slash cuối để tránh `http://x//products`
  return BACKEND_URL.replace(/^['"]|['"]$/g, '')
    .trim()
    .replace(/\/+$/, '');
}

export interface ServerFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit;
  /** Mặc định true: gắn Bearer từ HttpOnly cookie */
  withAuth?: boolean;
  /** Next.js cache: 'force-cache' | 'no-store' ... */
  cache?: RequestCache;
  /** ISR: số giây revalidate */
  revalidate?: number;
  /** Cache tags để revalidateTag() */
  tags?: string[];
}

function getCookieToken(cookieStore: Awaited<ReturnType<typeof cookies>>): string | undefined {
  return cookieStore.get('accessToken')?.value ?? cookieStore.get('access_token')?.value;
}

/**
 * Fetch dành cho Server Components / Route Handlers / Server Actions.
 * - Dùng `BACKEND_API_URL` (server-only), không lộ env public.
 * - Tự gắn Bearer từ HttpOnly cookie (cả 2 tên accessToken/access_token).
 * - Hỗ trợ ISR (revalidate/tags), unwrap { data } an toàn.
 * - Lỗi 4xx/5xx trả null. Muốn throw thì dùng `serverFetchOrThrow`.
 */
export async function serverFetch<T>(
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<T | null> {
  const { withAuth = true, cache, revalidate, tags, headers: initHeaders, ...rest } = options;

  const cookieStore = await cookies();

  const reqHeaders = new Headers(initHeaders);
  if (!reqHeaders.has('Content-Type')) {
    reqHeaders.set('Content-Type', 'application/json');
  }
  reqHeaders.set('Accept-Language', 'vi');

  if (withAuth) {
    const token = getCookieToken(cookieStore);
    if (token) reqHeaders.set('Authorization', `Bearer ${token}`);
  }

  const url = `${getBackendUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...rest,
      headers: reqHeaders,
      ...(cache ? { cache } : {}),
      ...(revalidate !== undefined || tags
        ? {
            next: {
              ...(revalidate !== undefined ? { revalidate } : {}),
              ...(tags ? { tags } : {}),
            },
          }
        : {}),
    });

    if (!res.ok) {
      // Chỉ log ồn khi dev, prod giữ im để khỏi rò rỉ URL/token
      if (isDev) {
        if (res.status === 401 || res.status === 403) {
          console.warn(`[serverFetch] ${endpoint}: ${res.status}`);
        } else {
          console.error(`[serverFetch] ${endpoint}: ${res.status} ${res.statusText}`);
        }
      }
      return null;
    }

    if (res.status === 204) return null;

    const json = await res.json().catch(() => null);
    if (json && typeof json === 'object' && 'data' in json) {
      return (json as { data: T }).data as T;
    }
    return json as T;
  } catch (error) {
    if (isDev) {
      console.error(`[serverFetch] ${endpoint}:`, error);
    }
    return null;
  }
}

/** Biến thể throw lỗi để Server Component dùng `notFound()` / `redirect()` được. */
export async function serverFetchOrThrow<T>(
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const data = await serverFetch<T>(endpoint, options);
  if (data === null) throw new Error(`serverFetch failed: ${endpoint}`);
  return data;
}
