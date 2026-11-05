'use client';

import * as React from 'react';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { progressKeys } from '../queries/progress.queries';
import { getMsUntilNextUtcMidnight, getUtcTodayDateString } from '../utils/progress-date';

export interface DocumentVisibilityTarget {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
  visibilityState: string;
}

/**
 * Hàm khởi tạo và quản lý bộ lập lịch chuyển ngày UTC (00:00 UTC) (Corrective C).
 * Có thể chạy độc lập hoặc trong React hook, dễ dàng kiểm thử trong môi trường Node.js.
 */
export function setupUtcDayRollover(
  queryClient: QueryClient,
  docTarget?: DocumentVisibilityTarget
): () => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let lastUtcDate = getUtcTodayDateString();

  const handleDayRollover = () => {
    const currentUtcDate = getUtcTodayDateString();
    lastUtcDate = currentUtcDate;

    const currentUserId = useAuthStore.getState().user?.id;
    if (currentUserId) {
      // Invalidate queries phụ thuộc chu kỳ ngày cho người dùng hiện tại
      queryClient.invalidateQueries({ queryKey: progressKeys.water(currentUserId) });
      queryClient.invalidateQueries({ queryKey: progressKeys.dashboard(currentUserId) });
    }
  };

  const scheduleNextMidnight = () => {
    const msUntilMidnight = getMsUntilNextUtcMidnight();
    // Thêm 500ms dung sai an toàn để đảm bảo backend đã bước sang ngày mới
    timerId = setTimeout(() => {
      handleDayRollover();
      scheduleNextMidnight();
    }, msUntilMidnight + 500);
  };

  scheduleNextMidnight();

  const handleVisibilityChange = () => {
    if (docTarget?.visibilityState === 'visible') {
      const currentUtcDate = getUtcTodayDateString();
      if (currentUtcDate !== lastUtcDate) {
        handleDayRollover();
        if (timerId) clearTimeout(timerId);
        scheduleNextMidnight();
      }
    }
  };

  docTarget?.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    if (timerId) clearTimeout(timerId);
    docTarget?.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Hook tự động phát hiện chuyển ngày theo lịch UTC (00:00 UTC) (Corrective C)
 * và làm mới các query phụ thuộc ngày (Water Today, Dashboard Summary).
 *
 * Đồng thời lắng nghe sự kiện 'visibilitychange' của trình duyệt để xử lý trường hợp
 * tab bị ẩn/thiết bị sleep khi thời điểm 00:00 UTC trôi qua.
 */
export function useUtcDayRollover() {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    return setupUtcDayRollover(queryClient, document);
  }, [queryClient]);
}
