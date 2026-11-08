import { SESSION_HINT_COOKIE } from '@/common/constants/routes';

/**
 * Cookie gợi ý phiên (không chứa bí mật) do BFF set cùng refresh cookie.
 * JS đọc được để biết có nên thử silent refresh hay không, kể cả khi
 * localStorage `auth-storage` đã bị xoá.
 */
export function hasSessionHint(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((part) => part.trim() === `${SESSION_HINT_COOKIE}=1`);
}
