// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
  cleanup,
  renderHook,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { progressApi } from '../api/progress.api';
import {
  progressKeys,
  clearProgressCache,
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
    it('surfaces visible error card when backend returns malformed timestamp through full Axios -> Mapper -> UI pipeline', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      // Phục hồi implementation thực của progressApi.getCurrentFasting đã bị mock trong beforeEach
      vi.spyOn(progressApi, 'getCurrentFasting').mockRestore();

      // Mock ở tầng Axios API boundary với payload DTO chứa ngày không hợp lệ 30/02
      // Kiểm thử toàn diện pipeline thực tế: Axios api.get -> progressApi.getCurrentFasting -> progressMapper.toCurrentFastingSession -> ném ProgressDataIntegrityError -> UI error card
      vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
        if (url === '/progress/fasting/current') {
          return {
            data: {
              sessionId: 'sess-corrupt',
              protocol: '16:8',
              startedAt: '2026-02-30T10:00:00Z', // 30/02 bất khả thi!
              targetEndedAt: '2026-02-30T20:00:00Z',
              status: 'InProgress',
            },
          } as any;
        }
        return { data: null } as any;
      });

      render(<FastingPanel />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/không thể tải trạng thái nhịn ăn/i)).toBeInTheDocument();
      });

      // Không hiển thị form nhịn ăn mới và tuyệt đối không fallback tạo timestamp giả mạo
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

    it('preserves User B queries when ProgressCacheSync is already mounted and User A cleanup finishes asynchronously', async () => {
      // User A đang đăng nhập và ProgressCacheSync đã mount sẵn trong layout
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      queryClient.setQueryData(progressKeys.dashboard(mockUserA.id), { currentWeightKg: 80 });
      queryClient.setQueryData(progressKeys.water(mockUserA.id), { consumedMl: 1500 });

      const { rerender } = render(<ProgressCacheSync />, { wrapper: createWrapper() });

      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserA.id))).toBeDefined();

      // User A đăng xuất và User B đăng nhập ngay sau đó
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      // User B nạp dữ liệu cache mới
      queryClient.setQueryData(progressKeys.dashboard(mockUserB.id), { currentWeightKg: 65 });
      queryClient.setQueryData(progressKeys.water(mockUserB.id), { consumedMl: 250 });

      rerender(<ProgressCacheSync />);

      // Dọn dẹp không đồng bộ hoàn tất: Cache của User A bị xóa, nhưng cache của User B bảo toàn tuyệt đối!
      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserA.id))).toBeUndefined();
      expect(queryClient.getQueryData(progressKeys.water(mockUserA.id))).toBeUndefined();
      expect(queryClient.getQueryData(progressKeys.dashboard(mockUserB.id))).toEqual({
        currentWeightKg: 65,
      });
      expect(queryClient.getQueryData(progressKeys.water(mockUserB.id))).toEqual({
        consumedMl: 250,
      });
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

  describe('Scenario P — Server, gateway and network error toasts in active vs switched session', () => {
    it('displays 502 Bad Gateway error toast in active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      vi.spyOn(progressApi, 'getCurrentFasting').mockResolvedValue(null);
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 502,
          data: { detail: 'Bad Gateway' },
        },
      };
      vi.spyOn(progressApi, 'startFasting').mockRejectedValueOnce(axiosError);

      render(<FastingPanel />, { wrapper: createWrapper() });

      const startBtn = await screen.findByText(/bắt đầu nhịn ăn ngay/i);
      await act(async () => {
        fireEvent.click(startBtn);
      });

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('502 Gateway'));
    });

    it('displays 503 Service Unavailable error toast in active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const axiosError = {
        isAxiosError: true,
        response: {
          status: 503,
          data: { detail: 'Service Unavailable' },
        },
      };
      vi.spyOn(progressApi, 'logWater').mockRejectedValueOnce(axiosError);

      render(<WaterTracker />, { wrapper: createWrapper() });

      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('503 Service Unavailable'));
    });

    it('displays 500 server error toast in active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { detail: 'Internal Server Error' },
        },
      };
      vi.spyOn(progressApi, 'logWater').mockRejectedValueOnce(axiosError);

      render(<WaterTracker />, { wrapper: createWrapper() });

      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      expect(toast.error).toHaveBeenCalledWith('Lỗi hệ thống máy chủ. Vui lòng thử lại sau.');
    });

    it('displays network disconnection error toast in active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const axiosError = {
        isAxiosError: true,
        request: {},
        response: undefined,
      };
      vi.spyOn(progressApi, 'logWater').mockRejectedValueOnce(axiosError);

      render(<WaterTracker />, { wrapper: createWrapper() });

      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.'
      );
    });

    it('suppresses 502/503/500/network error toasts completely when session switches to User B', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<any>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);

      const { rerender } = render(<WaterTracker />, { wrapper: createWrapper() });

      const quick250Btn = await screen.findByText('+250 ml');
      await act(async () => {
        fireEvent.click(quick250Btn);
      });

      // User A chuyển sang User B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      rerender(<WaterTracker />);

      // Request ban đầu của User A bị lỗi 500 từ server
      await act(async () => {
        deferred.reject({
          isAxiosError: true,
          response: { status: 500, data: { detail: 'Server exploded' } },
        });
      });

      // Tuyệt đối không hiển thị toast lỗi của User A cho User B!
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('Scenario Q — Dispatch-time session mismatch prevention', () => {
    it('aborts and issues zero HTTP calls if session is invalidated before mutationFn executes', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const apiSpy = vi.spyOn(progressApi, 'logWater');

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      // User A logs out
      act(() => {
        useAuthStore.getState().logout();
        syncProgressSessionWithAuth();
      });

      // Gọi mutate khi phiên đã mất
      await act(async () => {
        try {
          await result.current.mutateAsync({ amountMl: 250 });
        } catch {
          // Expected auth error
        }
      });

      // Không có bất kỳ HTTP call nào được dispatch
      expect(apiSpy).not.toHaveBeenCalled();
    });
  });

  describe('Scenario R — Immediate synchronous render-time isolation of private UI state', () => {
    it('synchronously hides User A private record during User B first commit render', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<any>();
      vi.spyOn(progressApi, 'logBodyMetric').mockReturnValueOnce(deferred.promise);

      const { rerender } = render(<BodyMetricForm />, { wrapper: createWrapper() });

      const submitBtn = screen.getByRole('button', { name: /lưu chỉ số cơ thể/i });
      await act(async () => {
        fireEvent.submit(submitBtn.closest('form')!);
      });

      // Hoàn tất lưu chỉ số của User A
      await act(async () => {
        deferred.resolve({
          id: 'metric-a',
          loggedAt: new Date('2026-11-04T12:00:00Z'),
          formattedLoggedAt: '19:00 - 04/11/2026',
          weightKg: 88.0,
          bmi: 27.5,
          bmiCategory: 'Overweight',
          bmiCategoryLabel: 'Thừa cân',
          bodyFatPercent: 25,
          waistCircumferenceCm: 90,
          systolicBloodPressure: null,
          diastolicBloodPressure: null,
          bloodPressureDisplay: null,
          restingHeartRate: null,
        });
      });

      // Verify User A đang nhìn thấy banner BMI của mình
      expect(
        screen.getByText(/đã ghi nhận chỉ số thành công vào cơ sở dữ liệu/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/88 kg/)).toBeInTheDocument();

      // Chuyển sang User B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      // Ngay tại render commit đầu tiên của User B, kết quả của User A phải biến mất hoàn toàn
      rerender(<BodyMetricForm />);

      expect(
        screen.queryByText(/đã ghi nhận chỉ số thành công vào cơ sở dữ liệu/i)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/88 kg/)).not.toBeInTheDocument();
    });
  });
});
