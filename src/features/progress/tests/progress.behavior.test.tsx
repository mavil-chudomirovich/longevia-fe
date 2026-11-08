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
import {
  FRIENDLY_ERRORS,
  NETWORK_ERROR_MESSAGE,
  friendlyMessageForStatus,
} from '@/lib/error-messages';
import { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { progressApi } from '../api/progress.api';
import {
  WaterSummary,
  SleepRecord,
  BodyMetricRecord,
  EndFastingResult,
  FastingStatusEnum,
  SleepQualityEnum,
  BmiCategoryEnum,
} from '../types/progress.model';
import {
  progressKeys,
  useStartFastingMutation,
  useLogWaterMutation,
  useLogSleepMutation,
  useLogBodyMetricMutation,
  __setProgressMutationTestSeams,
} from '../queries/progress.queries';
import { FastingPanel } from '../components/fasting-panel';
import { SleepLogForm } from '../components/sleep-log-form';
import { BodyMetricForm } from '../components/body-metric-form';
import { WaterTracker } from '../components/water-tracker';
import { ProgressCacheSync } from '../components/progress-cache-sync';
import {
  __resetProgressSessionForTests,
  syncProgressSessionWithAuth,
  getActiveSessionAbortControllerCount,
} from '../utils/progress-session';
import { UserStatus, type UserModel } from '@/features/auth/types/auth.model';
import {
  ProgressAuthError,
  ProgressSessionObsoleteError,
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
globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

describe('Progress Module - Real React Behavioral Regression Tests (Corrective C)', () => {
  let queryClient: QueryClient;

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

  const createWrapper = () => {
    const QueryWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
    QueryWrapper.displayName = 'QueryWrapper';
    return QueryWrapper;
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
    __setProgressMutationTestSeams(null);
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

      const deferred = createDeferred<WaterSummary>();
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

      const deferred = createDeferred<WaterSummary>();
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

      const deferred = createDeferred<WaterSummary>();
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

      const deferred = createDeferred<WaterSummary>();
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

      const deferred = createDeferred<BodyMetricRecord>();
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
          bmiCategory: BmiCategoryEnum.OBESE,
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

      const deferred = createDeferred<SleepRecord>();
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
          sleepQuality: SleepQualityEnum.GOOD,
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
        status: FastingStatusEnum.IN_PROGRESS,
        statusLabel: 'Đang nhịn ăn',
      });

      const deferred = createDeferred<EndFastingResult>();
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
          status: FastingStatusEnum.COMPLETED,
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
          data: {
            title: 'Conflict',
            detail: 'Already fasting',
            code: 'progress.fasting_active_conflict',
          },
        },
      };
      vi.spyOn(progressApi, 'startFasting').mockRejectedValueOnce(axiosError);

      render(<FastingPanel />, { wrapper: createWrapper() });

      const startBtn = await screen.findByText(/bắt đầu nhịn ăn ngay/i);
      await act(async () => {
        fireEvent.click(startBtn);
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Bạn đang có một phiên nhịn ăn chưa kết thúc')
      );
    });

    it('displays 422 height unavailable error toast with guidance in active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const axiosError = {
        isAxiosError: true,
        response: {
          status: 422,
          data: { code: 'progress.height_unavailable', detail: 'Missing height' },
        },
      };
      vi.spyOn(progressApi, 'logBodyMetric').mockRejectedValueOnce(axiosError);

      render(<BodyMetricForm />, { wrapper: createWrapper() });

      const submitBtn = screen.getByRole('button', { name: /lưu chỉ số cơ thể/i });
      await act(async () => {
        fireEvent.submit(submitBtn.closest('form')!);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Hồ sơ của bạn chưa có chiều cao'),
          expect.objectContaining({
            action: expect.objectContaining({ label: 'Cập nhật hồ sơ' }),
          })
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
          } as unknown as AxiosResponse;
        }
        return { data: null } as unknown as AxiosResponse;
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

      const deferredWater = createDeferred<WaterSummary>();
      const deferredSleep = createDeferred<SleepRecord>();
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
          sleepQuality: SleepQualityEnum.GOOD,
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

      const deferred = createDeferred<WaterSummary>();
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

  describe('Finding A — Guard optional mutation callbacks against obsolete sessions and verify controller cleanup', () => {
    it('invokes caller onSuccess and onSettled callbacks exactly once for active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      vi.spyOn(progressApi, 'logWater').mockResolvedValueOnce({
        date: '2026-11-04',
        consumedMl: 250,
        targetMl: 2500,
        percentComplete: 10,
        visualPercent: 10,
        remainingMl: 2250,
      });

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate({ amountMl: 250 }, { onSuccess, onError, onSettled });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ consumedMl: 250 }),
        { amountMl: 250 },
        expect.anything(),
        expect.anything()
      );
      expect(onError).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('invokes caller onError and onSettled callbacks exactly once when active mutation fails', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const error = new Error('Network failure');
      vi.spyOn(progressApi, 'logWater').mockRejectedValueOnce(error);

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      await act(async () => {
        result.current.mutate({ amountMl: 250 }, { onSuccess, onError, onSettled });
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
      });
      expect(onError).toHaveBeenCalledWith(
        error,
        { amountMl: 250 },
        expect.anything(),
        expect.anything()
      );
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('suppresses caller onSuccess, onError, and onSettled callbacks when session logs out before completion', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<WaterSummary>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      act(() => {
        result.current.mutate({ amountMl: 250 }, { onSuccess, onError, onSettled });
      });

      expect(getActiveSessionAbortControllerCount()).toBeGreaterThan(0);

      // User A logs out
      act(() => {
        useAuthStore.getState().logout();
        syncProgressSessionWithAuth();
      });

      // Mutation settles late
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

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(onSettled).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('suppresses caller callbacks when account switches to User B before completion', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<WaterSummary>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      act(() => {
        result.current.mutate({ amountMl: 250 }, { onSuccess, onError, onSettled });
      });

      // Switch to User B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

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

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(onSettled).not.toHaveBeenCalled();
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('mutateAsync resolves with expected payload in an active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const expectedPayload: WaterSummary = {
        date: '2026-11-04',
        consumedMl: 500,
        targetMl: 2500,
        percentComplete: 20,
        visualPercent: 20,
        remainingMl: 2000,
      };
      vi.spyOn(progressApi, 'logWater').mockResolvedValueOnce(expectedPayload);

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      let data: WaterSummary | null = null;
      await act(async () => {
        data = await result.current.mutateAsync({ amountMl: 500 });
      });

      expect(data).toEqual(expectedPayload);
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('mutateAsync rejects with ProgressSessionObsoleteError and suppresses callbacks when User A logs out during pending mutation', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<WaterSummary>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      let caughtError: unknown = null;
      act(() => {
        result.current
          .mutateAsync({ amountMl: 250 }, { onSuccess, onError, onSettled })
          .catch((err) => {
            caughtError = err;
          });
      });

      expect(getActiveSessionAbortControllerCount()).toBeGreaterThan(0);

      // User A logs out
      act(() => {
        useAuthStore.getState().logout();
        syncProgressSessionWithAuth();
      });

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

      expect(caughtError).toBeInstanceOf(ProgressAuthError);
      expect(caughtError).toBeInstanceOf(ProgressSessionObsoleteError);
      expect((caughtError as ProgressSessionObsoleteError).code).toBe('PROGRESS_SESSION_OBSOLETE');
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(onSettled).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('mutateAsync rejects with ProgressSessionObsoleteError and isolates private data when switching to User B during pending mutation', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<WaterSummary>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      let userAResult: WaterSummary | null = null;
      let caughtError: unknown = null;
      act(() => {
        result.current
          .mutateAsync({ amountMl: 250 }, { onSuccess, onError, onSettled })
          .then((res) => {
            userAResult = res;
          })
          .catch((err) => {
            caughtError = err;
          });
      });

      // Switch to User B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

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

      expect(userAResult).toBeNull();
      expect(caughtError).toBeInstanceOf(ProgressAuthError);
      expect(caughtError).toBeInstanceOf(ProgressSessionObsoleteError);
      expect((caughtError as ProgressSessionObsoleteError).code).toBe('PROGRESS_SESSION_OBSOLETE');
      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      expect(onSettled).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(invalidateSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: progressKeys.user(mockUserB.id) })
      );
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('mutateAsync rejects with ProgressSessionObsoleteError when same user relogins (new session ID) during pending mutation', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<WaterSummary>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      let caughtError: unknown = null;
      act(() => {
        result.current.mutateAsync({ amountMl: 250 }).catch((err) => {
          caughtError = err;
        });
      });

      // User A logs out and logs back in (generating a distinct sessionId)
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a-relogin' });
        syncProgressSessionWithAuth();
      });

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

      expect(caughtError).toBeInstanceOf(ProgressAuthError);
      expect(caughtError).toBeInstanceOf(ProgressSessionObsoleteError);
      expect((caughtError as ProgressSessionObsoleteError).code).toBe('PROGRESS_SESSION_OBSOLETE');
      expect(toast.success).not.toHaveBeenCalled();
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('mutateAsync resolves normally when token refreshes within the same active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-initial' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<WaterSummary>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferred.promise);

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      let data: WaterSummary | null = null;
      act(() => {
        result.current.mutateAsync({ amountMl: 250 }).then((res) => {
          data = res;
        });
      });

      // Silent token refresh in same active session
      act(() => {
        useAuthStore.getState().setToken('token-refreshed');
        syncProgressSessionWithAuth();
      });

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

      expect(data).toEqual(expect.objectContaining({ consumedMl: 250 }));
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('250 ml'));
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('mutateAsync preserves backend error rejection in active session without wrapping in obsolete error', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const backendError = new Error('Database write constraint violation');
      vi.spyOn(progressApi, 'logWater').mockRejectedValueOnce(backendError);

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      let caughtError: unknown = null;
      await act(async () => {
        try {
          await result.current.mutateAsync({ amountMl: 250 });
        } catch (err) {
          caughtError = err;
        }
      });

      expect(caughtError).toBe(backendError);
      expect(caughtError).not.toBeInstanceOf(ProgressSessionObsoleteError);
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('unconditionally unregisters controller even when consumer onSuccess callback throws an error', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      vi.spyOn(progressApi, 'logWater').mockResolvedValueOnce({
        date: '2026-11-04',
        consumedMl: 250,
        targetMl: 2500,
        percentComplete: 10,
        visualPercent: 10,
        remainingMl: 2250,
      });

      const explodingCallback = vi.fn(() => {
        throw new Error('Consumer callback exploded');
      });

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      try {
        await act(async () => {
          result.current.mutate({ amountMl: 250 }, { onSuccess: explodingCallback });
        });
      } catch {
        // Consumer callback error caught here
      }

      expect(explodingCallback).toHaveBeenCalled();
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('tracks concurrent mutations with independent controllers and cleans up on settlement across success, error, obsolete', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferredWater = createDeferred<WaterSummary>();
      const deferredSleep = createDeferred<SleepRecord>();
      vi.spyOn(progressApi, 'logWater').mockReturnValueOnce(deferredWater.promise);
      vi.spyOn(progressApi, 'logSleep').mockReturnValueOnce(deferredSleep.promise);

      const { result: waterHook } = renderHook(() => useLogWaterMutation(), {
        wrapper: createWrapper(),
      });
      const { result: sleepHook } = renderHook(() => useLogSleepMutation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        waterHook.current.mutate({ amountMl: 250 });
        sleepHook.current.mutate({
          sleptAt: '2026-11-03T23:00:00Z',
          wokeAt: '2026-11-04T07:00:00Z',
          sleepQuality: 'Good',
        });
      });

      expect(getActiveSessionAbortControllerCount()).toBe(2);

      await act(async () => {
        deferredWater.resolve({
          date: '2026-11-04',
          consumedMl: 250,
          targetMl: 2500,
          percentComplete: 10,
          visualPercent: 10,
          remainingMl: 2250,
        });
      });

      expect(getActiveSessionAbortControllerCount()).toBe(1);

      await act(async () => {
        deferredSleep.resolve({
          id: 'sleep-concurrent-cleanup',
          sleptAt: new Date(),
          wokeAt: new Date(),
          sleepQuality: SleepQualityEnum.GOOD,
          sleepQualityLabel: 'Tốt',
          durationHours: 8,
          formattedDuration: '8 giờ',
          date: '2026-11-04',
        });
      });

      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });
  });

  describe('Finding B1 (Scenario Q) — Deterministic dispatch-time race reproduction via test seams', () => {
    it('aborts before HTTP dispatch when session switches to User B during lifecycle pause', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const apiSpy = vi.spyOn(progressApi, 'logWater');
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const enteredBeforeDispatch = createDeferred<void>();
      const resumeBeforeDispatch = createDeferred<void>();

      __setProgressMutationTestSeams({
        beforeDispatch: async () => {
          enteredBeforeDispatch.resolve();
          await resumeBeforeDispatch.promise;
        },
      });

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      let mutationError: unknown = null;
      let promiseSettled = false;
      const mutationPromise = result.current
        .mutateAsync({ amountMl: 250 })
        .catch((err) => {
          mutationError = err;
        })
        .finally(() => {
          promiseSettled = true;
        });

      // Khẳng định luồng thực thi ĐÃ VÀO TRONG beforeDispatch trước khi can thiệp session
      await enteredBeforeDispatch.promise;
      expect(promiseSettled).toBe(false);
      expect(getActiveSessionAbortControllerCount()).toBeGreaterThan(0);

      // Account switches to User B while mutation is paused before dispatch
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      // Resume execution
      resumeBeforeDispatch.resolve();
      await mutationPromise;

      expect(apiSpy).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(invalidateSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: progressKeys.user(mockUserB.id) })
      );
      expect(mutationError).toBeInstanceOf(ProgressAuthError);
      expect(mutationError).toBeInstanceOf(ProgressSessionObsoleteError);
      expect((mutationError as ProgressSessionObsoleteError).code).toBe(
        'PROGRESS_SESSION_OBSOLETE'
      );
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('aborts before HTTP dispatch when same user logs out and logs back in (session ID renewal)', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const apiSpy = vi.spyOn(progressApi, 'logWater');
      const enteredBeforeDispatch = createDeferred<void>();
      const resumeBeforeDispatch = createDeferred<void>();

      __setProgressMutationTestSeams({
        beforeDispatch: async () => {
          enteredBeforeDispatch.resolve();
          await resumeBeforeDispatch.promise;
        },
      });

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      let mutationError: unknown = null;
      let promiseSettled = false;
      const mutationPromise = result.current
        .mutateAsync({ amountMl: 250 })
        .catch((err) => {
          mutationError = err;
        })
        .finally(() => {
          promiseSettled = true;
        });

      // Khẳng định luồng thực thi ĐÃ VÀO TRONG beforeDispatch trước khi can thiệp session
      await enteredBeforeDispatch.promise;
      expect(promiseSettled).toBe(false);
      expect(getActiveSessionAbortControllerCount()).toBeGreaterThan(0);

      // Same user logs out and logs back in (creates a fresh sessionId)
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a-relogin' });
        syncProgressSessionWithAuth();
      });

      // Resume execution
      resumeBeforeDispatch.resolve();
      await mutationPromise;

      expect(apiSpy).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(mutationError).toBeInstanceOf(ProgressAuthError);
      expect(mutationError).toBeInstanceOf(ProgressSessionObsoleteError);
      expect((mutationError as ProgressSessionObsoleteError).code).toBe(
        'PROGRESS_SESSION_OBSOLETE'
      );
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });

    it('permits HTTP dispatch when token refreshes for the same active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-initial' });
      syncProgressSessionWithAuth();

      vi.spyOn(progressApi, 'logWater').mockResolvedValueOnce({
        date: '2026-11-04',
        consumedMl: 250,
        targetMl: 2500,
        percentComplete: 10,
        visualPercent: 10,
        remainingMl: 2250,
      });

      const enteredBeforeDispatch = createDeferred<void>();
      const resumeBeforeDispatch = createDeferred<void>();

      __setProgressMutationTestSeams({
        beforeDispatch: async () => {
          enteredBeforeDispatch.resolve();
          await resumeBeforeDispatch.promise;
        },
      });

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      let mutationResult: WaterSummary | null = null;
      let promiseSettled = false;
      const mutationPromise = result.current
        .mutateAsync({ amountMl: 250 })
        .then((res) => {
          mutationResult = res;
        })
        .finally(() => {
          promiseSettled = true;
        });

      // Khẳng định luồng thực thi ĐÃ VÀO TRONG beforeDispatch trước khi đổi token
      await enteredBeforeDispatch.promise;
      expect(promiseSettled).toBe(false);
      expect(getActiveSessionAbortControllerCount()).toBeGreaterThan(0);

      // Silent token refresh: user and sessionId unchanged
      act(() => {
        useAuthStore.getState().setToken('token-refreshed');
        syncProgressSessionWithAuth();
      });

      // Resume execution
      resumeBeforeDispatch.resolve();
      await mutationPromise;

      expect(mutationResult).toEqual(expect.objectContaining({ consumedMl: 250 }));
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('250 ml'));
      expect(getActiveSessionAbortControllerCount()).toBe(0);
    });
  });

  describe('Finding B2 (Scenario P) — Real Axios transport and interceptor error handling', () => {
    let originalAdapter: unknown;

    beforeEach(() => {
      originalAdapter = api.defaults.adapter;
      // Do not mock progressApi methods in this suite so calls route through actual progressApi -> Axios
      vi.spyOn(progressApi, 'logWater').mockRestore();
      vi.spyOn(progressApi, 'startFasting').mockRestore();
      vi.spyOn(progressApi, 'logBodyMetric').mockRestore();
    });

    afterEach(() => {
      api.defaults.adapter = originalAdapter as typeof api.defaults.adapter;
    });

    const createMockAxiosError = (
      config: InternalAxiosRequestConfig,
      options: {
        status?: number;
        statusText?: string;
        data?: unknown;
        isNetwork?: boolean;
      }
    ) => {
      if (options.isNetwork) {
        return new AxiosError('Network Error', 'ERR_NETWORK', config, {}, undefined);
      }
      return new AxiosError(
        `Request failed with status code ${options.status}`,
        'ERR_BAD_RESPONSE',
        config,
        {},
        {
          status: options.status!,
          statusText: options.statusText || String(options.status),
          headers: {},
          config,
          data: options.data,
        }
      );
    };

    it('displays 502 Bad Gateway error toast in active session through real Axios interceptor with zero duplicate toast', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      api.defaults.adapter = async (config) => {
        throw createMockAxiosError(config, {
          status: 502,
          statusText: 'Bad Gateway',
          data: { detail: 'Bad Gateway' },
        });
      };

      const { result } = renderHook(() => useStartFastingMutation(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            protocol: '16:8',
            startedAt: '2026-11-04T12:00:00Z',
            targetHours: 16,
          });
        } catch {
          // Expected rejection
        }
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(friendlyMessageForStatus(502));
    });

    it('displays 503 Service Unavailable error toast in active session through real Axios interceptor with zero duplicate toast', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      api.defaults.adapter = async (config) => {
        throw createMockAxiosError(config, {
          status: 503,
          statusText: 'Service Unavailable',
          data: { detail: 'Service Unavailable' },
        });
      };

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ amountMl: 250 });
        } catch {
          // Expected rejection
        }
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(friendlyMessageForStatus(503));
    });

    it('displays 500 server error toast in active session through real Axios interceptor with zero duplicate toast', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      api.defaults.adapter = async (config) => {
        throw createMockAxiosError(config, {
          status: 500,
          statusText: 'Internal Server Error',
          data: { detail: 'Database crash' },
        });
      };

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ amountMl: 250 });
        } catch {
          // Expected rejection
        }
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(friendlyMessageForStatus(500));
    });

    it('displays network disconnection error toast in active session through real Axios interceptor with zero duplicate toast', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      api.defaults.adapter = async (config) => {
        throw createMockAxiosError(config, { isNetwork: true });
      };

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ amountMl: 250 });
        } catch {
          // Expected rejection
        }
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(NETWORK_ERROR_MESSAGE);
    });

    it('does not show a network toast for a request cancelled by the client (refetch/abort)', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      api.defaults.adapter = async (config) => {
        throw new AxiosError('canceled', 'ERR_CANCELED', config, {}, undefined);
      };

      await expect(api.get('/progress/water/today')).rejects.toBeDefined();

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('displays 409 conflict error toast through real Axios interceptor in active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      api.defaults.adapter = async (config) => {
        throw createMockAxiosError(config, {
          status: 409,
          data: {
            code: 'progress.fasting_active_conflict',
            detail: 'Already fasting',
          },
        });
      };

      const { result } = renderHook(() => useStartFastingMutation(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            protocol: '16:8',
            startedAt: '2026-11-04T12:00:00Z',
            targetHours: 16,
          });
        } catch {
          // Expected rejection
        }
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(
        FRIENDLY_ERRORS['progress.fasting_active_conflict'].message
      );
    });

    it('displays 422 height unavailable error toast through real Axios interceptor in active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      api.defaults.adapter = async (config) => {
        throw createMockAxiosError(config, {
          status: 422,
          data: { code: 'progress.height_unavailable', detail: 'Missing height' },
        });
      };

      const { result } = renderHook(() => useLogBodyMetricMutation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            loggedAt: '2026-11-04T12:00:00Z',
            weightKg: 80,
          });
        } catch {
          // Expected rejection
        }
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(
        FRIENDLY_ERRORS['progress.height_unavailable'].message,
        expect.objectContaining({
          action: expect.objectContaining({ label: 'Cập nhật hồ sơ' }),
        })
      );
    });

    it('displays 403 forbidden error toast through real Axios interceptor in active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      api.defaults.adapter = async (config) => {
        throw createMockAxiosError(config, {
          status: 403,
          data: {},
        });
      };

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ amountMl: 250 });
        } catch {
          // Expected rejection
        }
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Bạn không có quyền thực hiện thao tác này.');
    });

    it('displays 429 rate limit error toast through real Axios interceptor in active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      api.defaults.adapter = async (config) => {
        throw createMockAxiosError(config, {
          status: 429,
          data: { detail: 'Too many requests' },
        });
      };

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ amountMl: 250 });
        } catch {
          // Expected rejection
        }
      });

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(friendlyMessageForStatus(429));
    });

    it('completely suppresses error toasts when session switches to User B during network transport', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferredAdapter = createDeferred<void>();

      api.defaults.adapter = async (config) => {
        await deferredAdapter.promise;
        throw createMockAxiosError(config, {
          status: 500,
          data: { detail: 'Internal failure' },
        });
      };

      const { result } = renderHook(() => useLogWaterMutation(), { wrapper: createWrapper() });

      act(() => {
        result.current.mutate({ amountMl: 250 });
      });

      // User A switches to User B while request is inside Axios transport
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      // Network transport completes with error
      await act(async () => {
        deferredAdapter.resolve();
      });

      // Neither Axios nor Progress queries may show error toast to User B
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  describe('Finding C — Session-keyed form lifecycle and form value isolation', () => {
    it('isolates BodyMetricForm draft inputs across account switches', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const { rerender } = render(<BodyMetricForm />, { wrapper: createWrapper() });

      const weightInput = screen.getByLabelText(/cân nặng/i);
      const waistInput = screen.getByLabelText(/vòng eo/i);

      // User A types draft inputs
      fireEvent.change(weightInput, { target: { value: '85.5' } });
      fireEvent.change(waistInput, { target: { value: '92' } });

      expect(weightInput).toHaveValue(85.5);
      expect(waistInput).toHaveValue(92);

      // Switch to User B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      rerender(<BodyMetricForm />);

      // User B receives clean default values, not User A's unsubmitted draft
      const newWeightInput = screen.getByLabelText(/cân nặng/i);
      const newWaistInput = screen.getByLabelText(/vòng eo/i);
      expect(newWeightInput).toHaveValue(70);
      expect(newWaistInput).toHaveValue(null);
    });

    it('isolates SleepLogForm draft quality selection across account switches', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const { rerender } = render(<SleepLogForm />, { wrapper: createWrapper() });

      // User A selects Poor (Kém)
      const poorRadio = screen.getByRole('radio', { name: /kém/i });
      fireEvent.click(poorRadio);
      expect(poorRadio).toBeChecked();

      // Switch to User B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      rerender(<SleepLogForm />);

      // User B has default Good (Tốt) selected, not Poor
      const goodRadio = screen.getByRole('radio', { name: /^tốt\b/i });
      expect(goodRadio).toBeChecked();
    });

    it('isolates WaterTracker custom amount input across account switches', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const { rerender } = render(<WaterTracker />, { wrapper: createWrapper() });

      const customInput = await screen.findByRole('spinbutton');
      fireEvent.change(customInput, { target: { value: '600' } });
      expect(customInput).toHaveValue(600);

      // Switch to User B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      rerender(<WaterTracker />);

      // User B receives default 250ml
      const newCustomInput = await screen.findByRole('spinbutton');
      expect(newCustomInput).toHaveValue(250);
    });

    it('preserves user draft inputs through token refresh in the same active session', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-initial' });
      syncProgressSessionWithAuth();

      render(<BodyMetricForm />, { wrapper: createWrapper() });

      const weightInput = screen.getByLabelText(/cân nặng/i);
      fireEvent.change(weightInput, { target: { value: '82.5' } });
      expect(weightInput).toHaveValue(82.5);

      // Silent token refresh occurs
      act(() => {
        useAuthStore.getState().setToken('token-refreshed');
        syncProgressSessionWithAuth();
      });

      // SessionId is unchanged -> inner component was not remounted -> draft preserved
      expect(weightInput).toHaveValue(82.5);
    });

    it('prevents late mutation resolution from resetting the other user active form', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<BodyMetricRecord>();
      vi.spyOn(progressApi, 'logBodyMetric').mockReturnValueOnce(deferred.promise);

      const { rerender } = render(<BodyMetricForm />, { wrapper: createWrapper() });

      // User A submits form
      const submitBtn = screen.getByRole('button', { name: /lưu chỉ số cơ thể/i });
      await act(async () => {
        fireEvent.submit(submitBtn.closest('form')!);
      });

      // Account switches to User B
      act(() => {
        useAuthStore.getState().logout();
        useAuthStore.setState({ user: mockUserB, isAuthenticated: true, token: 'token-b' });
        syncProgressSessionWithAuth();
      });

      rerender(<BodyMetricForm />);

      // User B enters 65kg
      const userBWeight = screen.getByLabelText(/cân nặng/i);
      fireEvent.change(userBWeight, { target: { value: '65' } });
      expect(userBWeight).toHaveValue(65);

      // User A's mutation resolves late
      await act(async () => {
        deferred.resolve({
          id: 'metric-late',
          loggedAt: new Date(),
          formattedLoggedAt: '12:00',
          weightKg: 88,
          bmi: 27,
          bmiCategory: BmiCategoryEnum.OVERWEIGHT,
          bmiCategoryLabel: 'Thừa cân',
          bodyFatPercent: null,
          waistCircumferenceCm: null,
          systolicBloodPressure: null,
          diastolicBloodPressure: null,
          bloodPressureDisplay: null,
          restingHeartRate: null,
        });
      });

      // User B's form still has 65kg and was not reset or overwritten
      expect(userBWeight).toHaveValue(65);
    });

    it('renders cleanly in React.StrictMode without render-phase mutation warnings', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      // Wrap in React.StrictMode to guarantee double-render lifecycle safety
      const { unmount } = render(
        <React.StrictMode>
          <BodyMetricForm />
          <SleepLogForm />
          <WaterTracker />
        </React.StrictMode>,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('button', { name: /lưu chỉ số cơ thể/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /lưu ghi nhận giấc ngủ/i })).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: /ghi nhận/i })).toBeInTheDocument();

      unmount();
    });
  });

  describe('Scenario R — Immediate synchronous render-time isolation of private UI state', () => {
    it('synchronously hides User A private record during User B first commit render', async () => {
      useAuthStore.setState({ user: mockUserA, isAuthenticated: true, token: 'token-a' });
      syncProgressSessionWithAuth();

      const deferred = createDeferred<BodyMetricRecord>();
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
          bmiCategory: BmiCategoryEnum.OVERWEIGHT,
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
