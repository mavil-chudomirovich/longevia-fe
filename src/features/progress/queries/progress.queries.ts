import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
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

/**
 * Domain-specific Query Key Factory cho module Tiến trình & Sức khỏe
 */
export const progressKeys = {
  all: ['progress'] as const,
  dashboard: () => [...progressKeys.all, 'dashboard'] as const,
  fasting: () => [...progressKeys.all, 'fasting'] as const,
  fastingCurrent: () => [...progressKeys.fasting(), 'current'] as const,
  water: () => [...progressKeys.all, 'water'] as const,
  waterToday: () => [...progressKeys.water(), 'today'] as const,
  metrics: () => [...progressKeys.all, 'metrics'] as const,
  metricsHistory: (filters?: GetMetricsHistoryFilters) =>
    [...progressKeys.metrics(), 'history', filters ?? {}] as const,
};

/**
 * Xóa sạch toàn bộ cache dữ liệu tiến trình (gọi khi đăng xuất để bảo mật giữa các user)
 */
export function clearProgressCache(queryClient: ReturnType<typeof useQueryClient>): void {
  queryClient.removeQueries({ queryKey: progressKeys.all });
}

// ==========================================
// 1. QUERIES
// ==========================================

export function useDashboardSummaryQuery() {
  return useQuery<DashboardSummary>({
    queryKey: progressKeys.dashboard(),
    queryFn: ({ signal }) => progressApi.getDashboardSummary(signal),
    staleTime: 60 * 1000, // 1 phút
    gcTime: 5 * 60 * 1000,
  });
}

export function useCurrentFastingQuery() {
  return useQuery<CurrentFastingSession | null>({
    queryKey: progressKeys.fastingCurrent(),
    queryFn: ({ signal }) => progressApi.getCurrentFasting(signal),
    staleTime: 30 * 1000, // 30 giây
    gcTime: 5 * 60 * 1000,
    refetchInterval: (query) => {
      // Tự động làm mới mỗi 60 giây nếu có phiên đang diễn ra
      return query.state.data ? 60 * 1000 : false;
    },
  });
}

export function useWaterTodayQuery() {
  return useQuery<WaterSummary>({
    queryKey: progressKeys.waterToday(),
    queryFn: ({ signal }) => progressApi.getWaterToday(signal),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useMetricsHistoryQuery(filters?: GetMetricsHistoryFilters) {
  return useQuery<MetricsHistory>({
    queryKey: progressKeys.metricsHistory(filters),
    queryFn: ({ signal }) => progressApi.getMetricsHistory(filters, signal),
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
      queryClient.invalidateQueries({ queryKey: progressKeys.fastingCurrent() });
      queryClient.invalidateQueries({ queryKey: progressKeys.dashboard() });
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
      queryClient.invalidateQueries({ queryKey: progressKeys.fastingCurrent() });
      queryClient.invalidateQueries({ queryKey: progressKeys.dashboard() });
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
      queryClient.invalidateQueries({ queryKey: progressKeys.waterToday() });
      queryClient.invalidateQueries({ queryKey: progressKeys.dashboard() });
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
      queryClient.invalidateQueries({ queryKey: progressKeys.dashboard() });
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
      queryClient.invalidateQueries({ queryKey: progressKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: progressKeys.metrics() });
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
