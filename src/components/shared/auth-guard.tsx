'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { forceLogout, sharedRefresh } from '@/lib/auth-refresh';
import { hasSessionHint } from '@/lib/session-hint';
import { LoadingState } from './loading-state';

/**
 * Guard phía client cho route cần đăng nhập, đi kèm middleware.ts.
 *
 * Nếu chưa có phiên trong memory nhưng còn dấu hiệu đăng nhập (user persist
 * hoặc cookie hint), guard chờ silent refresh (dùng chung promise với
 * AuthProvider) rồi mới quyết định. Refresh thất bại -> xoá cookie phiên rồi
 * mới chuyển về /login để middleware không đẩy ngược lại.
 */
export function AuthGuard({
  children,
  loginPath = '/login',
}: {
  children: React.ReactNode;
  loginPath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated && (state.user || hasSessionHint())) {
        try {
          await sharedRefresh();
        } catch {
          await forceLogout();
        }
      }
      if (!cancelled) setChecked(true);
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!isAuthenticated) {
      router.replace(`${loginPath}?from=${encodeURIComponent(pathname)}`);
    }
  }, [checked, isAuthenticated, loginPath, pathname, router]);

  if (!checked || !isAuthenticated) {
    return <LoadingState message="Đang kiểm tra phiên đăng nhập..." />;
  }

  return <>{children}</>;
}
