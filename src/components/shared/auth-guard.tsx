'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { LoadingState } from './loading-state';

/**
 * Guard phía client cho route cần đăng nhập, đi kèm middleware.ts.
 *
 * Đợi Zustand persist hydrate xong mới quyết định redirect, tránh
 * redirect nhầm khi AuthProvider đang silent-refresh.
 *
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Đợi persist rehydrate (user từ localStorage) + 1 tick cho AuthProvider refresh
    const t = setTimeout(() => setHydrated(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace(`${loginPath}?from=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, isAuthenticated, loginPath, pathname, router]);

  if (!hydrated || !isAuthenticated) {
    return <LoadingState message="Đang kiểm tra phiên đăng nhập..." />;
  }

  return <>{children}</>;
}
