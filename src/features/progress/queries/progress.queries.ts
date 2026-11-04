import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { progressApi } from '../api/progress.api';
import {
  CurrentFastingSession,
  DashboardSummary,
  EndFastingResult,
  FastingSessionResult,
  GetMetricsHistoryFilters,
  MetricsHistory,
  SleepRecord,
  WaterSummary,
  BodyMetricRecord,
} from '../types/progress.model';
import {
  EndFastingFormValues,
  LogBodyMetricFormValues,
  LogSleepFormValues,
  LogWaterFormValues,
  StartFastingFormValues,
} from '../schemas/progress.schema';
import { ErrorResponse } from '@/types/api';
import { getUtcTodayDateString } from '../utils/progress-date';

/**
 * Domain-specific Query Key Factory cho module Tiến trình & Sức khỏe.
 * Toàn bộ khóa truy vấn đều được phân lập theo userId để đảm bảo bảo mật dữ liệu sức khỏe,
 * chống rò rỉ dữ liệu giữa các tài khoản khi đăng xuất / chuyển đổi người dùng (Corrective A).
 */
export const progressKeys = {
  all: ['progress'] as const,
  user: (userId: string) => [...progressKeys.all, userId] as const,
  dashboard: (userId: string) => [...progressKeys.user(userId), 'dashboard'] as const,
  fasting: (userId: string) => [...progressKeys.user(userId), 'fasting'] as const,
  fastingCurrent: (userId: string) => [...progressKeys.fasting(userId), 'current'] as const,
  water: (userId: string) => [...progressKeys.user(userId), 'water'] as const,
  waterToday: (userId: string, utcDate?: string) =>
    [...progressKeys.water(userId), 'today', utcDate ?? getUtcTodayDateString()] as const,
  metrics: (userId: string) => [...progressKeys.user(userId), 'metrics'] as const,
  metricsHistory: (userId: string, filters?: GetMetricsHistoryFilters) =>
    [...progressKeys.metrics(userId), 'history', filters ?? {}] as const,
};

/**
 * Xóa sạch toàn bộ cache dữ liệu tiến trình (hoặc của một user cụ thể).
 * Hủy tất cả các queries đang chạy trước khi removeQueries để tránh race condition.
 */
export async function clearProgressCache(queryClient: QueryClient, userId?: string): Promise<void> {
  const targetKey = userId ? progressKeys.user(userId) : progressKeys.all;
  await queryClient.cancelQueries({ queryKey: targetKey });
  queryClient.removeQueries({ queryKey: targetKey });
}

/**
 * Internal hook lấy userId và xác định query có được phép kích hoạt hay không.
 * Ngăn chặn tuyệt đối việc phát request khi phiên chưa xác thực hoặc không có userId.
 */
function useProgressAuth(customUserId?: string) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const effectiveUserId = customUserId ?? user?.id;
  const isEnabled = Boolean(effectiveUserId && (customUserId ? true : isAuthenticated));
  return { userId: effectiveUserId ?? '', isEnabled };
}

// ==========================================
// 1. QUERIES
// ==========================================

export function useDashboardSummaryQuery(customUserId?: string) {
  const { userId, isEnabled } = useProgressAuth(customUserId);

  return useQuery<DashboardSummary>({
    queryKey: progressKeys.dashboard(userId),
    queryFn: ({ signal }) => progressApi.getDashboardSummary(signal),
    enabled: isEnabled,
    staleTime: 60 * 1000, // 1 phút
    gcTime: 5 * 60 * 1000,
  });
}

export function useCurrentFastingQuery(customUserId?: string) {
  const { userId, isEnabled } = useProgressAuth(customUserId);

  return useQuery<CurrentFastingSession | null>({
    queryKey: progressKeys.fastingCurrent(userId),
    queryFn: ({ signal }) => progressApi.getCurrentFasting(signal),
    enabled: isEnabled,
    staleTime: 30 * 1000, // 30 giây
    gcTime: 5 * 60 * 1000,
    refetchInterval: (query) => {
      // Tự động làm mới mỗi 60 giây nếu có phiên đang diễn ra
      return query.state.data ? 60 * 1000 : false;
    },
  });
}

export function useWaterTodayQuery(utcDate?: string, customUserId?: string) {
  const { userId, isEnabled } = useProgressAuth(customUserId);

  return useQuery<WaterSummary>({
    queryKey: progressKeys.waterToday(userId, utcDate),
    queryFn: ({ signal }) => progressApi.getWaterToday(signal),
    enabled: isEnabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useMetricsHistoryQuery(filters?: GetMetricsHistoryFilters, customUserId?: string) {
  const { userId, isEnabled } = useProgressAuth(customUserId);

  return useQuery<MetricsHistory>({
    queryKey: progressKeys.metricsHistory(userId, filters),
    queryFn: ({ signal }) => progressApi.getMetricsHistory(filters, signal),
    enabled: isEnabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// ==========================================
// 2. MUTATIONS
// ==========================================

export function useStartFastingMutation() {
  const queryClient = useQueryClient();

  return useMutation<FastingSessionResult, AxiosError<ErrorResponse>, StartFastingFormValues>({
    mutationFn: (values) => progressApi.startFasting(values),
    onSuccess: () => {
      toast.success('Bắt đầu phiên nhịn ăn thành công!');
      const currentUserId = useAuthStore.getState().user?.id;
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: progressKeys.fastingCurrent(currentUserId) });
        queryClient.invalidateQueries({ queryKey: progressKeys.dashboard(currentUserId) });
      } else {
        queryClient.invalidateQueries({ queryKey: progressKeys.all });
      }
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        toast.error('Bạn đang có một phiên nhịn ăn chưa kết thúc.');
      } else {
        const msg =
          error.response?.data?.detail ||
          error.response?.data?.title ||
          'Không thể bắt đầu phiên nhịn ăn. Vui lòng thử lại.';
        toast.error(msg);
      }
    },
  });
}

export function useEndFastingMutation() {
  const queryClient = useQueryClient();

  return useMutation<EndFastingResult, AxiosError<ErrorResponse>, EndFastingFormValues>({
    mutationFn: (values) => progressApi.endFasting(values),
    onSuccess: (result) => {
      if (result.isGoalReached) {
        toast.success(
          `Chúc mừng! Bạn đã hoàn thành mục tiêu nhịn ăn (${result.formattedActualHours}).`
        );
      } else {
        toast.info(`Đã kết thúc phiên nhịn ăn (${result.formattedActualHours}).`);
      }
      const currentUserId = useAuthStore.getState().user?.id;
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: progressKeys.fastingCurrent(currentUserId) });
        queryClient.invalidateQueries({ queryKey: progressKeys.dashboard(currentUserId) });
      } else {
        queryClient.invalidateQueries({ queryKey: progressKeys.all });
      }
    },
    onError: (error) => {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.title ||
        'Không thể kết thúc phiên nhịn ăn. Vui lòng thử lại.';
      toast.error(msg);
    },
  });
}

export function useLogWaterMutation() {
  const queryClient = useQueryClient();

  return useMutation<WaterSummary, AxiosError<ErrorResponse>, LogWaterFormValues>({
    mutationFn: (values) => progressApi.logWater(values),
    onSuccess: (data, variables) => {
      toast.success(`Đã ghi nhận thêm ${variables.amountMl} ml nước uống.`);
      const currentUserId = useAuthStore.getState().user?.id;
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: progressKeys.water(currentUserId) });
        queryClient.invalidateQueries({ queryKey: progressKeys.dashboard(currentUserId) });
      } else {
        queryClient.invalidateQueries({ queryKey: progressKeys.all });
      }
    },
    onError: (error) => {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.title ||
        'Không thể ghi nhận nước uống. Vui lòng thử lại.';
      toast.error(msg);
    },
  });
}

export function useLogSleepMutation() {
  const queryClient = useQueryClient();

  return useMutation<SleepRecord, AxiosError<ErrorResponse>, LogSleepFormValues>({
    mutationFn: (values) => progressApi.logSleep(values),
    onSuccess: (record) => {
      toast.success(`Đã ghi nhận giấc ngủ (${record.formattedDuration}) thành công!`);
      const currentUserId = useAuthStore.getState().user?.id;
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: progressKeys.dashboard(currentUserId) });
      } else {
        queryClient.invalidateQueries({ queryKey: progressKeys.all });
      }
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        toast.error('Khoảng thời gian này đã trùng với một giấc ngủ đã được ghi nhận trước đó.');
      } else {
        const msg =
          error.response?.data?.detail ||
          error.response?.data?.title ||
          'Không thể ghi nhận giấc ngủ. Vui lòng kiểm tra lại thời gian.';
        toast.error(msg);
      }
    },
  });
}

export function useLogBodyMetricMutation() {
  const queryClient = useQueryClient();

  return useMutation<BodyMetricRecord, AxiosError<ErrorResponse>, LogBodyMetricFormValues>({
    mutationFn: (values) => progressApi.logBodyMetric(values),
    onSuccess: (record) => {
      toast.success(`Đã lưu chỉ số cơ thể! BMI: ${record.bmi} (${record.bmiCategoryLabel}).`);
      const currentUserId = useAuthStore.getState().user?.id;
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: progressKeys.dashboard(currentUserId) });
        queryClient.invalidateQueries({ queryKey: progressKeys.metrics(currentUserId) });
      } else {
        queryClient.invalidateQueries({ queryKey: progressKeys.all });
      }
    },
    onError: (error) => {
      const status = error.response?.status;
      const errorData = error.response?.data;
      const detail = errorData?.detail || '';

      if (status === 422 || detail.includes('height_unavailable')) {
        toast.error(
          'Hồ sơ của bạn chưa có thông tin chiều cao. Vui lòng cập nhật chiều cao trong trang Hồ sơ cá nhân để tính BMI.'
        );
      } else if (status === 503 || detail.includes('identity_unavailable')) {
        toast.error(
          'Dịch vụ thông tin hồ sơ tạm thời không khả dụng. Vui lòng thử lại sau ít phút.'
        );
      } else if (status === 502 || detail.includes('identity_integration_failure')) {
        toast.error(
          'Lỗi kết nối với dịch vụ hồ sơ. Vui lòng liên hệ quản trị viên nếu tình trạng tiếp diễn.'
        );
      } else {
        toast.error(detail || errorData?.title || 'Không thể lưu chỉ số cơ thể. Vui lòng thử lại.');
      }
    },
  });
}
