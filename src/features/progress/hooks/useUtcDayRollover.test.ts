import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { setupUtcDayRollover, DocumentVisibilityTarget } from './useUtcDayRollover';
import { useAuthStore } from '@/store/useAuthStore';
import { progressKeys } from '../queries/progress.queries';
import * as dateUtils from '../utils/progress-date';
import { UserRole, MemberStatus } from '@/common/enums';
import { User } from '@/features/auth/types/auth.model';

describe('useUtcDayRollover / setupUtcDayRollover (Corrective C)', () => {
  let queryClient: QueryClient;

  const mockUser: User = {
    id: 'user-utc-test-123',
    email: 'test@longevia.com',
    displayName: 'Test User',
    avatarUrl: '',
    role: UserRole.MEMBER,
    status: MemberStatus.ACTIVE,
    createdAt: new Date(),
    contributorApplication: null,
    initials: 'TU',
  };

  let mockDoc: DocumentVisibilityTarget & {
    listeners: Record<string, (() => void)[]>;
    triggerVisibilityChange: (newState: string) => void;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    useAuthStore.setState({ user: mockUser, isAuthenticated: true, token: 'mock-token' });

    mockDoc = {
      visibilityState: 'visible',
      listeners: {},
      addEventListener(type: string, listener: () => void) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(listener);
      },
      removeEventListener(type: string, listener: () => void) {
        if (this.listeners[type]) {
          this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
        }
      },
      triggerVisibilityChange(newState: string) {
        this.visibilityState = newState;
        (this.listeners['visibilitychange'] || []).forEach((fn) => fn());
      },
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    useAuthStore.getState().logout();
    queryClient.clear();
    vi.restoreAllMocks();
  });

  it('schedules invalidation for UTC midnight rollover', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(dateUtils, 'getMsUntilNextUtcMidnight').mockReturnValue(5000);
    vi.spyOn(dateUtils, 'getUtcTodayDateString')
      .mockReturnValueOnce('2026-11-04')
      .mockReturnValue('2026-11-05');

    const cleanup = setupUtcDayRollover(queryClient, mockDoc);

    // Trước khi hết thời gian, chưa invalidate
    expect(invalidateSpy).not.toHaveBeenCalled();

    // Tiến thời gian qua 5000ms + 500ms dung sai an toàn
    vi.advanceTimersByTime(5550);

    // Đã invalidate water và dashboard của user
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: progressKeys.water(mockUser.id),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: progressKeys.dashboard(mockUser.id),
    });

    cleanup();
  });

  it('triggers day rollover on visibilitychange when UTC date has changed', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(dateUtils, 'getMsUntilNextUtcMidnight').mockReturnValue(3600000); // 1 giờ nữa

    // Bắt đầu ngày 2026-11-04
    vi.spyOn(dateUtils, 'getUtcTodayDateString')
      .mockReturnValueOnce('2026-11-04')
      .mockReturnValue('2026-11-05'); // Lần sau đọc trả về ngày mới

    const cleanup = setupUtcDayRollover(queryClient, mockDoc);

    // Kích hoạt visibilitychange khi tab được focus lại
    mockDoc.triggerVisibilityChange('visible');

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: progressKeys.water(mockUser.id),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: progressKeys.dashboard(mockUser.id),
    });

    cleanup();
  });

  it('does not trigger rollover if visibilitychange happens on the same UTC day', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.spyOn(dateUtils, 'getMsUntilNextUtcMidnight').mockReturnValue(3600000);

    // Luôn là cùng một ngày
    vi.spyOn(dateUtils, 'getUtcTodayDateString').mockReturnValue('2026-11-04');

    const cleanup = setupUtcDayRollover(queryClient, mockDoc);

    mockDoc.triggerVisibilityChange('visible');

    expect(invalidateSpy).not.toHaveBeenCalled();

    cleanup();
  });

  it('cleans up timer and event listener on cleanup callback', () => {
    const removeSpy = vi.spyOn(mockDoc, 'removeEventListener');
    vi.spyOn(dateUtils, 'getMsUntilNextUtcMidnight').mockReturnValue(5000);

    const cleanup = setupUtcDayRollover(queryClient, mockDoc);

    cleanup();

    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(mockDoc.listeners['visibilitychange']).toHaveLength(0);
  });
});
