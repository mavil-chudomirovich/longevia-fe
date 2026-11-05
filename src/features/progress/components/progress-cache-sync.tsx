'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { clearProgressCache, progressKeys } from '../queries/progress.queries';
import { useUtcDayRollover } from '../hooks/useUtcDayRollover';

/**
 * Thành phần kiểm soát vòng đời Cache tiến trình (Corrective A & C).
 * Được gắn tại `src/app/progress/layout.tsx`.
 *
 * Chức năng:
 * 1. Phân lập dữ liệu triệt để giữa các phiên người dùng (Account A -> B).
 * 2. Hủy các query đang pending và xóa cache khi người dùng đăng xuất hoặc chuyển tài khoản.
 * 3. Kích hoạt scheduler tự động làm mới dữ liệu tại mốc 00:00 UTC (useUtcDayRollover).
 */
export function ProgressCacheSync() {
  const queryClient = useQueryClient();
  useUtcDayRollover();

  const currentUserId = useAuthStore((state) => state.user?.id);
  const lastUserIdRef = React.useRef<string | undefined>(currentUserId);

  // 1. Dọn dẹp cache của user khác khi component mount (phòng hờ account switch xảy ra ở route khác)
  React.useEffect(() => {
    queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey;
        // Khóa dạng ['progress', userId, ...]
        if (key[0] === 'progress' && key.length > 1 && typeof key[1] === 'string') {
          return key[1] !== (currentUserId ?? '');
        }
        return false;
      },
    });
    lastUserIdRef.current = currentUserId;
  }, [currentUserId, queryClient]);

  // 2. Đăng ký theo dõi sự kiện thay đổi phiên xác thực từ useAuthStore
  React.useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      const newUserId = state.user?.id;
      const previousUserId = lastUserIdRef.current;

      if (previousUserId && previousUserId !== newUserId) {
        // Người dùng đã đăng xuất hoặc chuyển đổi tài khoản:
        // Hủy toàn bộ query đang pending và xóa cache dữ liệu của user cũ một cách an toàn
        void clearProgressCache(queryClient, previousUserId);
      }

      lastUserIdRef.current = newUserId;
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return null;
}
