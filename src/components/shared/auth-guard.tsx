'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/common/enums';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';

/**
 * Guard phía client cho route cần đăng nhập / phân quyền.
 * Dùng kèm middleware.ts (check token + role ADMIN ở Edge).
 *
 * Đợi Zustand persist hydrate xong mới quyết định redirect, tránh
 * redirect nhầm khi AuthProvider đang silent-refresh.
 *
 * @example
 * <AuthGuard roles={[UserRole.ADMIN]}><AdminPanel /></AuthGuard>
 */
export function AuthGuard({
  children,
  roles,
  loginPath = '/login',
}: {
  children: React.ReactNode;
  roles?: UserRole[];
  loginPath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
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

  if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
    return <ErrorState title="Bạn không có quyền truy cập trang này." />;
  }

  return <>{children}</>;
}
