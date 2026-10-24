'use client';

import axios from 'axios';
import { setAccessToken, clearAccessToken } from './auth-token';
import { useAuthStore } from '@/store/useAuthStore';
import { authMapper } from '@/features/auth/mappers/auth.mapper';
import type { RefreshResponseDto } from '@/features/auth/types/auth.dto';

/**
 * Singleton refresh cho toàn bộ tab.
 * - Trong 1 tab: `refreshPromise` dedup mọi caller (AuthProvider + axios interceptor).
 * - Cross-tab: dùng `navigator.locks` (Web Locks API) để chỉ 1 tab được refresh tại 1 thời điểm.
 *   Fallback: localStorage lock + polling khi không có Web Locks.
 *
 * Backend `refresh` là rotation + revoke family nếu reuse -> 2 request song song với cùng
 * token cũ sẽ khiến family bị revoke (REFRESH_TOKEN_REUSED). Phải đảm bảo không bao giờ
 * gửi 2 refresh đồng thời, kể cả cross-tab.
 */

let refreshPromise: Promise<string> | null = null;
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL_MS = 2000;
const LOCK_KEY = 'auth:refresh:lock';
const LOCK_TTL_MS = 15000;

function tryAcquireLocalLock(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return true;
  try {
    const now = Date.now();
    const existing = localStorage.getItem(LOCK_KEY);
    if (existing) {
      const ts = parseInt(existing, 10);
      if (!Number.isNaN(ts) && now - ts < LOCK_TTL_MS) return false;
    }
    localStorage.setItem(LOCK_KEY, String(now));
    return true;
  } catch {
    return true;
  }
}

function releaseLocalLock(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const ts = parseInt(localStorage.getItem(LOCK_KEY) ?? '0', 10);
    // Chỉ xóa nếu lock do chính mình tạo (trong TTL)
    if (Date.now() - ts < LOCK_TTL_MS) localStorage.removeItem(LOCK_KEY);
  } catch {
    /* ignore */
  }
}

async function doFetchRefresh(): Promise<string> {
  // Đi qua Next proxy để forward HttpOnly cookie + nhận Set-Cookie rotation
  const res = await axios.post<RefreshResponseDto>('/api/auth/refresh-token', {}, { baseURL: '' });
  const raw = res.data as RefreshResponseDto & { accessToken?: string };
  const envelope: RefreshResponseDto =
    raw && typeof raw === 'object' && 'accessToken' in raw && !('data' in raw)
      ? { data: raw as RefreshResponseDto['data'] }
      : raw;
  const token = authMapper.toRefreshedTokenModel(envelope).accessToken;
  if (token) {
    setAccessToken(token);
    useAuthStore.getState().setToken(token);
    // Nếu đã có user, refresh lại profile để đồng bộ role
    try {
      const { authApi } = await import('@/features/auth/api/auth.api');
      const user = await authApi.getMe();
      if (user.id) useAuthStore.getState().setUser(user);
    } catch {
      /* không chặn refresh nếu getMe fail */
    }
  }
  return token;
}

/**
 * Refresh có dedup + cross-tab lock. Trả về accessToken mới hoặc '' nếu không có phiên.
 * Throw nếu backend trả 401 (INVALID_REFRESH_TOKEN / REFRESH_TOKEN_REUSED / TOKEN_EXPIRED).
 */
export async function sharedRefresh(): Promise<string> {
  // Throttle: nếu vừa refresh xong <2s, trả token hiện tại ngay
  if (Date.now() - lastRefreshTime < MIN_REFRESH_INTERVAL_MS) {
    const current = useAuthStore.getState().token;
    if (current) return current;
  }

  if (refreshPromise) return refreshPromise;

  const createPromise = async (): Promise<string> => {
    const hasLock = tryAcquireLocalLock();
    if (!hasLock) {
      // Tab khác đang refresh -> poll chờ token mới
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 300));
        const t = useAuthStore.getState().token;
        if (t) return t;
        // Nếu lock hết hạn mà vẫn chưa có token, thử lại
        if (tryAcquireLocalLock()) break;
      }
    }
    try {
      const token = await doFetchRefresh();
      lastRefreshTime = Date.now();
      return token;
    } finally {
      releaseLocalLock();
    }
  };

  const run = (): Promise<string> => {
    refreshPromise = createPromise().finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  };

  // Cross-tab serialization bằng Web Locks API khi có
  if (typeof navigator !== 'undefined' && 'locks' in navigator) {
    const locks = (
      navigator as unknown as {
        locks: { request: (name: string, fn: () => Promise<string>) => Promise<string> };
      }
    ).locks;
    try {
      return await locks.request('auth-refresh', run);
    } catch {
      return run();
    }
  }
  return run();
}

export function clearRefreshState(): void {
  refreshPromise = null;
  lastRefreshTime = 0;
  releaseLocalLock();
}

/**
 * Đăng xuất triệt để dùng chung cho mọi đường logout client (interceptor khi
 * refresh gãy, AuthProvider khi silent-refresh fail, nút đăng xuất tay nếu cần).
 * Luôn gọi logout proxy TRƯỚC để xóa HttpOnly cookies phía server — nếu chỉ
 * clear store, cookie mồ côi còn hạn sẽ khiến middleware đá `/login` → `/`
 * và user kẹt ở trạng thái "đã logout nhưng vẫn vào trang chủ".
 */
export async function forceLogout(): Promise<void> {
  try {
    await axios.post('/api/auth/logout', { allDevices: false }, { baseURL: '', timeout: 8000 });
  } catch {
    /* Logout proxy idempotent — BE down vẫn tiếp tục logout phía client */
  }
  clearRefreshState();
  clearAccessToken();
  useAuthStore.getState().logout();
}
