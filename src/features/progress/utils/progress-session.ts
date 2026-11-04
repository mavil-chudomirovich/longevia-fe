import * as React from 'react';
import { useAuthStore } from '@/store/useAuthStore';

let sessionEpoch = 0;
let activeSessionId = '';
let activeUserId: string | null = null;
let lastAuthToken: string | null = null;
let isSubscribed = false;

function generateSessionId(userId: string): string {
  return `sess_${userId}_${++sessionEpoch}_${Date.now()}`;
}

export function syncProgressSessionWithAuth(): void {
  const state = useAuthStore.getState();
  const isAuthValid =
    Boolean(state.isAuthenticated) && Boolean(state.user?.id) && Boolean(state.token);

  if (!isAuthValid) {
    activeSessionId = '';
    activeUserId = null;
    lastAuthToken = null;
    return;
  }

  const newUserId = state.user!.id;
  const newToken = state.token;

  // Nếu user thay đổi, hoặc session trước đó đã hết hạn/chưa có:
  if (activeUserId !== newUserId || !activeSessionId || lastAuthToken === null) {
    activeUserId = newUserId;
    activeSessionId = generateSessionId(newUserId);
    lastAuthToken = newToken;
  } else if (lastAuthToken !== newToken) {
    // Token refresh hợp lệ trong cùng một phiên: duy trì sessionId để không làm gián đoạn mutations đang chạy
    lastAuthToken = newToken;
  }
}

function ensureSessionSubscribed(): void {
  if (isSubscribed) return;
  isSubscribed = true;
  syncProgressSessionWithAuth();
  useAuthStore.subscribe(() => {
    syncProgressSessionWithAuth();
  });
}

/**
 * Trả về thông tin phiên xác thực hiện tại của module Progress (Corrective B).
 * Trả về null nếu người dùng chưa đăng nhập hoặc phiên đã hết hiệu lực.
 */
export function getProgressSessionContext(): {
  userId: string;
  sessionId: string;
} | null {
  ensureSessionSubscribed();
  syncProgressSessionWithAuth();

  if (!activeUserId || !activeSessionId) {
    return null;
  }
  return {
    userId: activeUserId,
    sessionId: activeSessionId,
  };
}

/**
 * Kiểm tra xem phiên mutation ban đầu có còn đang hoạt động hay không.
 * Ngăn chặn tuyệt đối việc hoàn tất của User A làm thay đổi UI hay invalidation cache của User B (hoặc session mới của chính User A).
 */
export function isProgressSessionActive(
  initiatingUserId?: string,
  initiatingSessionId?: string
): boolean {
  ensureSessionSubscribed();
  syncProgressSessionWithAuth();

  if (!initiatingUserId || !initiatingSessionId) return false;
  return (
    activeUserId === initiatingUserId &&
    activeSessionId === initiatingSessionId &&
    Boolean(activeSessionId)
  );
}

/**
 * Hook theo dõi phiên đăng nhập của module Progress trong các component React.
 */
export function useProgressSession() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return React.useMemo(() => {
    ensureSessionSubscribed();
    syncProgressSessionWithAuth();
    return {
      userId: activeUserId,
      sessionId: activeSessionId,
      isAuthenticated: Boolean(activeUserId && activeSessionId),
    };
  }, [user?.id, token, isAuthenticated]);
}

/**
 * Helper dành riêng cho môi trường kiểm thử để reset trạng thái session giữa các test case.
 */
export function __resetProgressSessionForTests(): void {
  activeSessionId = '';
  activeUserId = null;
  lastAuthToken = null;
  sessionEpoch = 0;
  syncProgressSessionWithAuth();
}
