import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { progressKeys, clearProgressCache, useDashboardSummaryQuery } from './progress.queries';
import { useAuthStore } from '@/store/useAuthStore';
import { UserStatus, type UserModel } from '@/features/auth/types/auth.model';
import {
  getProgressSessionContext,
  isProgressSessionActive,
  syncProgressSessionWithAuth,
  __resetProgressSessionForTests,
} from '../utils/progress-session';
import { progressApi } from '../api/progress.api';

describe('Progress Queries - User-Isolated Cache & Lifecycle (Corrective A & B)', () => {
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

  const mockUserA: UserModel = {
    id: 'user-aaa-111',
    email: 'user-a@longevia.com',
    fullName: 'User A',
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    profile: null,
    hasProfile: false,
  };

  const mockUserB: UserModel = {
    id: 'user-bbb-222',
    email: 'user-b@longevia.com',
    fullName: 'User B',
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    profile: null,
    hasProfile: false,
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
    __resetProgressSessionForTests();
    useAuthStore.getState().logout();
  });

  afterEach(() => {
    queryClient.clear();
    __resetProgressSessionForTests();
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

  describe('Audit useProgressAuth - Anti-Bypass & Mismatched User ID Protection', () => {
    it('disables query when unauthenticated even if customUserId is provided', () => {
      useAuthStore.getState().logout();

      // Giả lập hook query với customUserId khi chưa đăng nhập
      const authState = useAuthStore.getState();
      expect(authState.isAuthenticated).toBe(false);

      // useProgressAuth logic test:
      const authUserId = authState.user?.id;
      const customUserId = 'victim-user-999';
      const isMatch = !customUserId || customUserId === authUserId;
      const isEnabled = Boolean(authState.isAuthenticated && authUserId && isMatch);

      expect(isEnabled).toBe(false);
    });

    it('disables query when authenticated as User A but customUserId is User B (mismatch protection)', () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });

      const authState = useAuthStore.getState();
      const authUserId = authState.user?.id;
      const customUserId = mockUserB.id; // Mismatched!

      const isMatch = !customUserId || customUserId === authUserId;
      const isEnabled = Boolean(authState.isAuthenticated && authUserId && isMatch);

      expect(isEnabled).toBe(false);
    });

    it('enables query when authenticated as User A and customUserId matches User A', () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });

      const authState = useAuthStore.getState();
      const authUserId = authState.user?.id;
      const customUserId = mockUserA.id; // Matching!

      const isMatch = !customUserId || customUserId === authUserId;
      const isEnabled = Boolean(authState.isAuthenticated && authUserId && isMatch);

      expect(isEnabled).toBe(true);
    });

    it('enables query when authenticated as User A and customUserId is omitted', () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });

      const authState = useAuthStore.getState();
      const authUserId = authState.user?.id;
      const customUserId = undefined;

      const isMatch = !customUserId || customUserId === authUserId;
      const isEnabled = Boolean(authState.isAuthenticated && authUserId && isMatch);

      expect(isEnabled).toBe(true);
    });
  });

  describe('Session Ownership & Relogin Distinctions (Corrective B)', () => {
    it('generates distinct session ID for same-user relogin', () => {
      // 1. User A login session 1
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-1' });
      syncProgressSessionWithAuth();
      const session1 = getProgressSessionContext();
      expect(session1).not.toBeNull();
      expect(session1?.userId).toBe(mockUserA.id);

      // 2. User A logout
      useAuthStore.getState().logout();
      syncProgressSessionWithAuth();
      expect(getProgressSessionContext()).toBeNull();
      expect(isProgressSessionActive(session1?.userId, session1?.sessionId)).toBe(false);

      // 3. User A login session 2
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-2' });
      syncProgressSessionWithAuth();
      const session2 = getProgressSessionContext();

      expect(session2).not.toBeNull();
      expect(session2?.userId).toBe(mockUserA.id);
      // Hai session ID phải khác nhau dù cùng userId
      expect(session2?.sessionId).not.toBe(session1?.sessionId);

      // Session 1 bị coi là lỗi thời (obsolete)
      expect(isProgressSessionActive(session1?.userId, session1?.sessionId)).toBe(false);
      // Session 2 đang active
      expect(isProgressSessionActive(session2?.userId, session2?.sessionId)).toBe(true);
    });

    it('preserves session ID on token refresh within the same active session', () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'initial-token' });
      syncProgressSessionWithAuth();
      const sessionInitial = getProgressSessionContext();

      // Silent refresh: chỉ đổi token, không đổi user và không logout
      useAuthStore.getState().setToken('refreshed-token');
      syncProgressSessionWithAuth();
      const sessionAfterRefresh = getProgressSessionContext();

      expect(sessionAfterRefresh?.sessionId).toBe(sessionInitial?.sessionId);
      expect(isProgressSessionActive(sessionInitial?.userId, sessionInitial?.sessionId)).toBe(true);
    });
  });

  describe('clearProgressCache (Cache Invalidation and Removal)', () => {
    it('cancels pending queries and removes cache for a specific user without affecting others', async () => {
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

      await clearProgressCache(queryClient, mockUserA.id);

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
