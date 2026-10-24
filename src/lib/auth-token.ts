/**
 * Single Source of Truth cho accessToken (in-memory).
 * - Không đọc trực tiếp localStorage trong interceptor nữa.
 * - Zustand store sẽ đồng bộ vào đây qua setSession/setToken.
 * - Reload trang -> memory mất -> AuthProvider sẽ silent-refresh bằng HttpOnly cookie.
 */

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function clearAccessToken() {
  _accessToken = null;
}
