'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken, setAccessToken } from '@/lib/auth-token';
import { sharedRefresh, forceLogout } from '@/lib/auth-refresh';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);

    const token = useAuthStore.getState().token ?? getAccessToken();
    if (!token) {
      // Chỉ silent-refresh khi từng đăng nhập (còn user persist trong storage).
      // KHÔNG kiểm tra `document.cookie`: cookie refresh là HttpOnly nên JS
      // không bao giờ đọc được — check cũ khiến F5 nào cũng mất phiên.
      const persistedUser = useAuthStore.getState().user;
      if (!persistedUser) return;

      void sharedRefresh().catch(() => {
        // Refresh cookie hết hạn/bị thu hồi -> đăng xuất triệt để (xóa cả
        // HttpOnly cookies) để không kẹt loop /login → / ở lần vào sau.
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
