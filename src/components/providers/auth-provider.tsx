'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken, setAccessToken } from '@/lib/auth-token';
import { sharedRefresh, forceLogout } from '@/lib/auth-refresh';
import { hasSessionHint } from '@/lib/session-hint';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);

    const token = useAuthStore.getState().token ?? getAccessToken();
    if (!token) {
      // Silent-refresh khi có dấu hiệu từng đăng nhập: user persist trong storage
      // HOẶC cookie gợi ý phiên `lv_session_hint` (JS đọc được, không chứa bí mật).
      // Kiểm cả hint để localStorage bị xoá không làm kẹt phiên.
      const persistedUser = useAuthStore.getState().user;
      if (!persistedUser && !hasSessionHint()) return;

      void sharedRefresh().catch(() => {
        // Refresh cookie hết hạn/bị thu hồi -> đăng xuất triệt để (xóa cả
        // HttpOnly cookies) để không kẹt loop ở lần vào sau.
        void forceLogout();
      });
    } else if (token && !getAccessToken()) {
      setAccessToken(token);
    }
  }, []);

  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}
