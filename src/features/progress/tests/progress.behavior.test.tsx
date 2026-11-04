// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { progressApi } from '../api/progress.api';
import {
  progressKeys,
  useStartFastingMutation,
  useEndFastingMutation,
  useLogWaterMutation,
  useLogSleepMutation,
  useLogBodyMetricMutation,
} from '../queries/progress.queries';
import { FastingPanel } from '../components/fasting-panel';
import { SleepLogForm } from '../components/sleep-log-form';
import { BodyMetricForm } from '../components/body-metric-form';
import { WaterTracker } from '../components/water-tracker';
import { ProgressCacheSync } from '../components/progress-cache-sync';
import {
  __resetProgressSessionForTests,
  syncProgressSessionWithAuth,
} from '../utils/progress-session';
import { UserRole, MemberStatus } from '@/common/enums';
import { User } from '@/features/auth/types/auth.model';
import {
  ProgressAuthError,
  ProgressDataIntegrityError,
} from '../errors/progress-data-integrity.error';

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock localStorage for Zustand persist in JSDOM
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock ResizeObserver for Radix UI components in JSDOM
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
globalThis.ResizeObserver = ResizeObserverMock as any;

describe('Progress Module - Real React Behavioral Regression Tests (Corrective C)', () => {
  let queryClient: QueryClient;

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

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  function createDeferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  beforeEach(() => {
    cleanup();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    __resetProgressSessionForTests();
    useAuthStore.getState().logout();
    vi.clearAllMocks();

    // Default safe mocks for queries to avoid unmocked network calls in JSDOM
    vi.spyOn(progressApi, 'getWaterToday').mockResolvedValue({
      date: '2026-11-04',
      consumedMl: 1000,
      targetMl: 2500,
      percentComplete: 40,
      visualPercent: 40,
      remainingMl: 1500,
    });
    vi.spyOn(progressApi, 'getCurrentFasting').mockResolvedValue(null);
    vi.spyOn(progressApi, 'getDashboardSummary').mockResolvedValue({
      currentWeightKg: null,
      initialWeightKg: null,
      weightDeltaKg: null,
      currentBmi: null,
      bmiCategory: null,
      bmiCategoryLabel: null,
      currentStreakDays: 0,
      bestStreakDays: 0,
      fastingThisWeekCompleted: 0,
      averageSleepHours: null,
      hasRecordedMetrics: false,
    });
    vi.spyOn(progressApi, 'getMetricsHistory').mockResolvedValue({
      items: [],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasPrevPage: false,
      hasNextPage: false,
    });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    __resetProgressSessionForTests();
    useAuthStore.getState().logout();
    vi.restoreAllMocks();
  });

  describe('Scenario A — Normal authenticated mutation', () => {
    it('executes successfully, triggers toast and invalidates initiating user queries', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      vi.spyOn(progressApi, 'logWater').mockResolvedValueOnce({
        date: '2026-11-04',
        consumedMl: 250,
        targetMl: 2500,
        percentComplete: 10,
        visualPercent: 10,
        remainingMl: 2250,
      });

      render(<WaterTracker />, { wrapper: createWrapper() });

      // Click nút thêm nhanh 250ml sau khi query đã mount
      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('250 ml'));
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: progressKeys.water(mockUserA.id),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: progressKeys.dashboard(mockUserA.id),
      });
    });
  });

  describe('Scenario B — User logs out while mutation is pending', () => {
    it('suppresses toasts and does not invalidate any cache when completed after logout', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<any>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      render(<WaterTracker />, { wrapper: createWrapper() });

      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      // User A đăng xuất khi request đang pending
      act(() => {
        useAuthStore.getState().logout();
        syncProgressSessionWithAuth();
      });

      // Request User A trả về sau khi đã đăng xuất
      await act(async () => {
        deferred.resolve({
          date: '2026-11-04',
          consumedMl: 250,
          targetMl: 2500,
          percentComplete: 10,
          visualPercent: 10,
          remainingMl: 2250,
        });
      });

      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('Scenario C — A to B account switch while mutation is pending', () => {
    it('suppresses User A toast and does not invalidate User B cache upon late resolution', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<any>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      render(<WaterTracker />, { wrapper: createWrapper() });

      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      // Chuyển sang User B khi request đang pending
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      // Request User A hoàn tất
      await act(async () => {
        deferred.resolve({
          date: '2026-11-04',
          consumedMl: 250,
          targetMl: 2500,
          percentComplete: 10,
          visualPercent: 10,
          remainingMl: 2250,
        });
      });

      expect(toast.success).not.toHaveBeenCalled();
      // Không hề invalidate cache của User B
      expect(invalidateSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: progressKeys.user(mockUserB.id) })
      );
    });
  });

  describe('Scenario D — Late failure on account switch', () => {
    it('does not display User A error toast to User B upon late rejection', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<any>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);

      render(<WaterTracker />, { wrapper: createWrapper() });

      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      // Chuyển sang User B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      // Request của A bị reject
      await act(async () => {
        deferred.reject(new Error('Network error on User A'));
      });

      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('Scenario E — Same-user relogin (Session 1 vs Session 2)', () => {
    it('suppresses side-effects for same-user relogin when mutation was initiated in previous session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-session-1' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<any>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      render(<WaterTracker />, { wrapper: createWrapper() });

      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      // User A logout rồi đăng nhập lại (session 2)
      act(() => {
        useAuthStore.getState().logout();
        syncProgressSessionWithAuth();
        useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-session-2' });
        syncProgressSessionWithAuth();
      });

      // Request từ session 1 hoàn tất
      await act(async () => {
        deferred.resolve({
          date: '2026-11-04',
          consumedMl: 250,
          targetMl: 2500,
          percentComplete: 10,
          visualPercent: 10,
          remainingMl: 2250,
        });
      });

      // Phải coi là obsolete, không toast và không invalidate
      expect(toast.success).not.toHaveBeenCalled();
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('Scenario F — Private body metric result isolation', () => {
    it('never displays User A measurement or BMI to User B and clears private result state on session switch', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<any>();
      vi.spyOn(progressApi, 'logBodyMetric').mockReturnValueOnce(deferred.promise);

      const onSuccessLogged = vi.fn();
      const { rerender } = render(<BodyMetricForm onSuccessLogged={onSuccessLogged} />, {
        wrapper: createWrapper(),
      });

      // Submit form của User A
      const submitBtn = screen.getByRole('button', { name: /lưu chỉ số cơ thể/i });
      await act(async () => {
        fireEvent.submit(submitBtn.closest('form')!);
      });

      // Chuyển sang User B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      rerender(<BodyMetricForm onSuccessLogged={onSuccessLogged} />);

      // Request User A trả về kết quả
      await act(async () => {
        deferred.resolve({
          id: 'metric-private-a',
          loggedAt: new Date('2026-11-04T12:00:00Z'),
          formattedLoggedAt: '19:00 - 04/11/2026',
          weightKg: 95.5,
          bmi: 31.2,
          bmiCategory: 'Obese',
          bmiCategoryLabel: 'Béo phì',
          bodyFatPercent: 28,
          waistCircumferenceCm: 100,
          systolicBloodPressure: null,
          diastolicBloodPressure: null,
          bloodPressureDisplay: null,
          restingHeartRate: null,
        });
      });

      // B không nhận callback và không thấy kết quả riêng tư của A
      expect(onSuccessLogged).not.toHaveBeenCalled();
      expect(screen.queryByText(/chỉ số vừa ghi nhận thành công/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/95.5/)).not.toBeInTheDocument();
    });
  });

  describe('Scenario G — Private sleep record isolation', () => {
    it('does not display lastLoggedSleep to User B after account switch', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<any>();
      vi.spyOn(progressApi, 'logSleep').mockReturnValueOnce(deferred.promise);

      const { rerender } = render(<SleepLogForm />, { wrapper: createWrapper() });

      const submitBtn = screen.getByRole('button', { name: /lưu ghi nhận giấc ngủ/i });
      await act(async () => {
        fireEvent.submit(submitBtn.closest('form')!);
      });

      // Switch to B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      rerender(<SleepLogForm />);

      // Request User A hoàn tất
      await act(async () => {
        deferred.resolve({
          id: 'sleep-private-a',
          sleptAt: new Date('2026-11-03T23:00:00Z'),
          wokeAt: new Date('2026-11-04T08:00:00Z'),
          sleepQuality: 'Good',
          sleepQualityLabel: 'Tốt',
          durationHours: 9,
          formattedDuration: '9 giờ',
          date: '2026-11-04',
        });
      });

      expect(screen.queryByText(/đã ghi nhận giấc ngủ/i)).not.toBeInTheDocument();
      expect(screen.queryByText('9 giờ')).not.toBeInTheDocument();
    });
  });

  describe('Scenario H — Fasting completion modal isolation', () => {
    it('does not open completedResultModal for User B when User A fasting completes', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      // Mock session đang diễn ra
      vi.spyOn(progressApi, 'getCurrentFasting').mockResolvedValue({
        sessionId: 'fasting-active-a',
        protocol: '16:8',
        startedAt: new Date('2026-11-04T00:00:00Z'),
        targetEndedAt: new Date('2026-11-04T16:00:00Z'),
        targetHours: 16,
        elapsedHours: 16.5,
        remainingHours: 0,
        progressPercent: 103,
        visualPercent: 100,
        isGoalReached: true,
        status: 'InProgress' as any,
        statusLabel: 'Đang nhịn ăn',
      });

      const deferred = createDeferred<any>();
      vi.spyOn(progressApi, 'endFasting').mockReturnValueOnce(deferred.promise);

      const { rerender } = render(<FastingPanel />, { wrapper: createWrapper() });

      // Đợi load xong session
      const endBtn = await screen.findByText(/kết thúc phiên/i);
      fireEvent.click(endBtn);

      // Xác nhận kết thúc
      const confirmBtn = await screen.findByRole('button', { name: /xác nhận kết thúc/i });
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      // Chuyển sang User B trước khi API trả về
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      rerender(<FastingPanel />);

      await act(async () => {
        deferred.resolve({
          sessionId: 'fasting-active-a',
          actualHours: 16.5,
          targetHours: 16,
          isGoalReached: true,
          status: 'Completed',
          formattedActualHours: '16 giờ 30 phút',
        });
      });

      expect(screen.queryByText(/xuất sắc! bạn đã hoàn thành mục tiêu!/i)).not.toBeInTheDocument();
    });
  });

  describe('Scenario I — Business errors preserved in active session', () => {
    it('displays 409 conflict error toast for active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      vi.spyOn(progressApi, 'getCurrentFasting').mockResolvedValue(null);
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 409,
          data: { title: 'Conflict', detail: 'Already fasting' },
        },
      };
      vi.spyOn(progressApi, 'startFasting').mockRejectedValueOnce(axiosError);

      render(<FastingPanel />, { wrapper: createWrapper() });

      const startBtn = await screen.findByText(/bắt đầu nhịn ăn ngay/i);
      await act(async () => {
        fireEvent.click(startBtn);
      });

      expect(toast.error).toHaveBeenCalledWith('Bạn đang có một phiên nhịn ăn chưa kết thúc.');
    });

    it('displays 422 height unavailable error toast with guidance in active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const axiosError = {
        isAxiosError: true,
        response: {
          status: 422,
          data: { detail: 'progress.height_unavailable' },
        },
      };
      const apiSpy = vi.spyOn(progressApi, 'logBodyMetric').mockRejectedValueOnce(axiosError);

      render(<BodyMetricForm />, { wrapper: createWrapper() });

      const submitBtn = screen.getByRole('button', { name: /lưu chỉ số cơ thể/i });
      await act(async () => {
        fireEvent.submit(submitBtn.closest('form')!);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Hồ sơ của bạn chưa có thông tin chiều cao')
        );
      });
    });
  });

  describe('Scenario J — Mapper error in real component displays explicit error state', () => {
    it('surfaces visible error card when backend returns malformed timestamp', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      // API trả về timestamp bất khả thi (Feb 30) -> Mapper ném ProgressDataIntegrityError
      vi.spyOn(progressApi, 'getCurrentFasting').mockRejectedValueOnce(
        new ProgressDataIntegrityError('startedAt', 'PROGRESS_INVALID_TIMESTAMP', 'CurrentFasting')
      );

      render(<FastingPanel />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/không thể tải trạng thái nhịn ăn/i)).toBeInTheDocument();
      });

      // Không hiển thị form nhịn ăn mới
      expect(screen.queryByText(/bắt đầu phiên nhịn ăn mới/i)).not.toBeInTheDocument();
      // Hiển thị nút thử lại
      expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument();
    });
  });

  describe('Scenario K — Query isolation and cache cleanup via ProgressCacheSync', () => {
    it('evicts User A cache when User B enters the Progress layout', async () => {
      // 1. User A có data trong cache
      queryClient.setQueryData(progressKeys.dashboard(mockUserA.id), {
        currentWeightKg: 75,
      });
      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserA.id))).toBeDefined();

      // 2. Chuyển sang User B
      useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
      syncProgressSessionWithAuth();

      // 3. Mount ProgressCacheSync
      render(<ProgressCacheSync />, { wrapper: createWrapper() });

      // Cache của User A phải bị dọn dẹp ngay lập tức
      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserA.id))).toBeUndefined();
    });
  });

  describe('Scenario L — Unauthenticated mutation blocked before network call', () => {
    it('throws ProgressAuthError and issues no network request when unauthenticated', async () => {
      useAuthStore.getState().logout();
      syncProgressSessionWithAuth();

      const apiSpy = vi.spyOn(progressApi, 'logWater');

      render(<WaterTracker />, { wrapper: createWrapper() });

      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      // Tuyệt đối không gọi network
      expect(apiSpy).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Phiên đăng nhập không hợp lệ')
      );
    });
  });

  describe('Scenario M — Concurrent mutations across account switch', () => {
    it('suppresses both in-flight mutations when switching users simultaneously', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferredWater = createDeferred<any>();
      const deferredSleep = createDeferred<any>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferredWater.promise);
      vi.spyOn(progressApi, 'logSleep').mockReturnValueOnce(deferredSleep.promise);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { unmount } = render(
        <>
          <WaterTracker />
          <SleepLogForm />
        </>,
        { wrapper: createWrapper() }
      );

      // Trigger cả 2 mutation cùng lúc
      const quick250Btn = await screen.findByText('+250 ml');
      const submitSleepBtn = screen.getByRole('button', { name: /lưu ghi nhận giấc ngủ/i });

      await act(async () => {
        fireEvent.click(quick250Btn);
        fireEvent.submit(submitSleepBtn.closest('form')!);
      });

      // Chuyển sang User B khi cả 2 đang pending
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      // Cả hai hoàn tất muộn
      await act(async () => {
        deferredWater.resolve({
          date: '2026-11-04',
          consumedMl: 250,
          targetMl: 2500,
          percentComplete: 10,
          visualPercent: 10,
          remainingMl: 2250,
        });
        deferredSleep.resolve({
          id: 'sleep-concurrent',
          sleptAt: new Date('2026-11-03T23:00:00Z'),
          wokeAt: new Date('2026-11-04T08:00:00Z'),
          sleepQuality: 'Good',
          sleepQualityLabel: 'Tốt',
          durationHours: 9,
          formattedDuration: '9 giờ',
          date: '2026-11-04',
        });
      });

      expect(toast.success).not.toHaveBeenCalled();
      expect(invalidateSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: progressKeys.user(mockUserB.id) })
      );

      unmount();
    });
  });

  describe('Scenario N — Auth state changes without account switching (Token refresh)', () => {
    it('preserves mutation ownership through token refresh', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-initial' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<any>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      render(<WaterTracker />, { wrapper: createWrapper() });

      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      // Silent refresh: chỉ đổi token
      act(() => {
        useAuthStore.getState().setToken('token-refreshed');
        syncProgressSessionWithAuth();
      });

      // Request hoàn tất
      await act(async () => {
        deferred.resolve({
          date: '2026-11-04',
          consumedMl: 250,
          targetMl: 2500,
          percentComplete: 10,
          visualPercent: 10,
          remainingMl: 2250,
        });
      });

      // Vẫn thông báo thành công cho phiên hợp lệ
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('250 ml'));
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: progressKeys.water(mockUserA.id),
      });
    });
  });

  describe('Scenario O — Query cache unmount cleanup and session invalidation', () => {
    it('completely removes previous user query cache from client upon session reset', async () => {
      // 1. Populate cache for user A
      queryClient.setQueryData(progressKeys.dashboard(mockUserA.id), { currentWeightKg: 80 });
      queryClient.setQueryData(progressKeys.water(mockUserA.id), { consumedMl: 2000 });
      queryClient.setQueryData(progressKeys.fasting(mockUserA.id), { status: 'InProgress' });

      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserA.id))).toBeDefined();
      expect(queryClient.getQueryData(progressKeys.water(mockUserA.id))).toBeDefined();

      // 2. User A logs out and User B logs in
      useAuthStore.getState().logout();
      useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
      syncProgressSessionWithAuth();

      // 3. Render ProgressCacheSync
      render(<ProgressCacheSync />, { wrapper: createWrapper() });

      // Verify all User A cache queries are evicted from memory
      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserA.id))).toBeUndefined();
      expect(queryClient.getQueryData(progressKeys.water(mockUserA.id))).toBeUndefined();
      expect(queryClient.getQueryData(progressKeys.fasting(mockUserA.id))).toBeUndefined();
    });
  });
});
