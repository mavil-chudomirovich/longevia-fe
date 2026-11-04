import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { progressKeys, clearProgressCache } from './progress.queries';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole, MemberStatus } from '@/common/enums';
import { User } from '@/features/auth/types/auth.model';

describe('Progress Queries - User-Isolated Cache & Lifecycle (Corrective A & C)', () => {
  let queryClient: QueryClient;

  // Mock localStorage for node environment
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  const mockUserA: User = {
    id: 'user-aaa-111',
    email: 'user-a@longevia.com',
    displayName: 'User A',
    avatarUrl: '',
    role: UserRole.MEMBER,
    status: MemberStatus.ACTIVE,
    createdAt: new Date(),
    contributorApplication: null,
    initials: 'UA',
  };

  const mockUserB: User = {
    id: 'user-bbb-222',
    email: 'user-b@longevia.com',
    displayName: 'User B',
    avatarUrl: '',
    role: UserRole.MEMBER,
    status: MemberStatus.ACTIVE,
    createdAt: new Date(),
    contributorApplication: null,
    initials: 'UB',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    queryClient.clear();
    useAuthStore.getState().logout();
    vi.restoreAllMocks();
  });

  describe('Query Key Isolation by userId (Corrective A)', () => {
    it('generates distinct query keys for different user accounts', () => {
      const dashboardKeyA = progressKeys.dashboard(mockUserA.id);
      const dashboardKeyB = progressKeys.dashboard(mockUserB.id);

      expect(dashboardKeyA).toEqual(['progress', 'user-aaa-111', 'dashboard']);
      expect(dashboardKeyB).toEqual(['progress', 'user-bbb-222', 'dashboard']);
      expect(dashboardKeyA).not.toEqual(dashboardKeyB);
    });

    it('scopes fasting current keys by userId', () => {
      const fastingKeyA = progressKeys.fastingCurrent(mockUserA.id);
      const fastingKeyB = progressKeys.fastingCurrent(mockUserB.id);

      expect(fastingKeyA).toEqual(['progress', 'user-aaa-111', 'fasting', 'current']);
      expect(fastingKeyB).toEqual(['progress', 'user-bbb-222', 'fasting', 'current']);
      expect(fastingKeyA).not.toEqual(fastingKeyB);
    });

    it('scopes water today keys by userId and includes UTC date (Corrective C)', () => {
      const waterKeyA = progressKeys.waterToday(mockUserA.id, '2026-11-04');
      const waterKeyB = progressKeys.waterToday(mockUserB.id, '2026-11-04');
      const waterKeyTomorrow = progressKeys.waterToday(mockUserA.id, '2026-11-05');

      expect(waterKeyA).toEqual(['progress', 'user-aaa-111', 'water', 'today', '2026-11-04']);
      expect(waterKeyB).toEqual(['progress', 'user-bbb-222', 'water', 'today', '2026-11-04']);
      expect(waterKeyTomorrow).toEqual([
        'progress',
        'user-aaa-111',
        'water',
        'today',
        '2026-11-05',
      ]);

      expect(waterKeyA).not.toEqual(waterKeyB);
      expect(waterKeyA).not.toEqual(waterKeyTomorrow);
    });

    it('scopes metrics history keys by userId and filter parameters', () => {
      const filters = { pageNumber: 1, pageSize: 10 };
      const historyKeyA = progressKeys.metricsHistory(mockUserA.id, filters);
      const historyKeyB = progressKeys.metricsHistory(mockUserB.id, filters);

      expect(historyKeyA).toEqual(['progress', 'user-aaa-111', 'metrics', 'history', filters]);
      expect(historyKeyB).toEqual(['progress', 'user-bbb-222', 'metrics', 'history', filters]);
      expect(historyKeyA).not.toEqual(historyKeyB);
    });
  });

  describe('clearProgressCache (Cache Invalidation and Removal)', () => {
    it('cancels pending queries and removes cache for a specific user without affecting others', async () => {
      // Mock dữ liệu trong cache cho User A và User B
      queryClient.setQueryData(progressKeys.dashboard(mockUserA.id), {
        currentWeightKg: 70,
      });
      queryClient.setQueryData(progressKeys.dashboard(mockUserB.id), {
        currentWeightKg: 85,
      });

      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserA.id))).toEqual({
        currentWeightKg: 70,
      });
      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserB.id))).toEqual({
        currentWeightKg: 85,
      });

      // Xóa cache của User A
      await clearProgressCache(queryClient, mockUserA.id);

      // User A bị xóa, User B vẫn nguyên vẹn
      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserA.id))).toBeUndefined();
      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserB.id))).toEqual({
        currentWeightKg: 85,
      });
    });

    it('clears all progress queries when no userId is specified (logout scenario)', async () => {
      queryClient.setQueryData(progressKeys.dashboard(mockUserA.id), { currentWeightKg: 70 });
      queryClient.setQueryData(progressKeys.waterToday(mockUserA.id, '2026-11-04'), {
        consumedMl: 1500,
      });
      queryClient.setQueryData(progressKeys.dashboard(mockUserB.id), { currentWeightKg: 85 });

      await clearProgressCache(queryClient);

      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserA.id))).toBeUndefined();
      expect(
        queryClient.getQueryData(progressKeys.waterToday(mockUserA.id, '2026-11-04'))
      ).toBeUndefined();
      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserB.id))).toBeUndefined();
    });

    it('cancels active queries before removal to avoid race conditions', async () => {
      const cancelSpy = vi.spyOn(queryClient, 'cancelQueries');
      const removeSpy = vi.spyOn(queryClient, 'removeQueries');

      await clearProgressCache(queryClient, mockUserA.id);

      expect(cancelSpy).toHaveBeenCalledWith({ queryKey: progressKeys.user(mockUserA.id) });
      expect(removeSpy).toHaveBeenCalledWith({ queryKey: progressKeys.user(mockUserA.id) });
    });
  });
});
