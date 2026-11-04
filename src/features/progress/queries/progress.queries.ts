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
import { getProgressSessionContext, isProgressSessionActive } from '../utils/progress-session';
import {
  ProgressAuthError,
  ProgressDataIntegrityError,
} from '../errors/progress-data-integrity.error';

/**
 * Domain-specific Query Key Factory cho module Tiến trình & Sức khỏe.
 * Toàn bộ khóa truy vấn đều được phân lập theo userId để đảm bảo bảo mật dữ liệu sức khỏe,
 * chống rò rỉ dữ liệu giữa các tài khoản khi đăng xuất / chuyển đổi người dùng (Corrective A & B).
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
 * Ngăn chặn hoàn toàn việc bypass xác thực bằng customUserId:
 * 1. Query chỉ được phép kích hoạt khi phiên xác thực hợp lệ (isAuthenticated && user.id).
 * 2. Nếu customUserId được truyền vào nhưng không khớp với authUserId đang đăng nhập,
 *    VÔ HIỆU HÓA HOÀN TOÀN TRUY VẤN để ngăn chặn việc lưu dữ liệu của User A vào cache key của User B.
 */
function useProgressAuth(customUserId?: string) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authUserId = user?.id;

  const isMatch = !customUserId || customUserId === authUserId;
  const isEnabled = Boolean(isAuthenticated && authUserId && isMatch);

  return { userId: isEnabled ? (authUserId ?? '') : '', isEnabled };
}

/**
 * Context định danh cho mỗi lần kích hoạt mutation (Per-invocation Mutation Context - Corrective B).
 * Đảm bảo liên kết chặt chẽ kết quả hoàn tất với đúng tài khoản và phiên đăng nhập đã khởi tạo nó.
 */
export interface ProgressMutationContext {
  initiatingUserId: string;
  initiatingSessionId: string;
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
// 2. MUTATIONS (Session-Safe & Invocation-Bound)
// ==========================================

export function useStartFastingMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    FastingSessionResult,
    AxiosError<ErrorResponse> | ProgressAuthError | ProgressDataIntegrityError | Error,
    StartFastingFormValues,
    ProgressMutationContext
  >({
    mutationFn: async (values) => {
      const session = getProgressSessionContext();
      if (!session) {
        throw new ProgressAuthError();
      }
      return progressApi.startFasting(values);
    },
    onMutate: async () => {
      const session = getProgressSessionContext();
      if (!session) {
        throw new ProgressAuthError();
      }
      return {
        initiatingUserId: session.userId,
        initiatingSessionId: session.sessionId,
      };
    },
    onSuccess: (_result, _variables, context) => {
      if (
        !context ||
        !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)
      ) {
        return;
      }
      toast.success('Bắt đầu phiên nhịn ăn thành công!');
      queryClient.invalidateQueries({
        queryKey: progressKeys.fastingCurrent(context.initiatingUserId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.dashboard(context.initiatingUserId),
      });
    },
    onError: (error, _variables, context) => {
      if (error instanceof ProgressAuthError) {
        toast.error(error.message);
        return;
      }
      if (
        !context ||
        !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)
      ) {
        return;
      }
      if (error instanceof ProgressDataIntegrityError) {
        toast.error(error.message);
        return;
      }
      const axiosError = error as AxiosError<ErrorResponse>;
      if (axiosError.response?.status === 409) {
        toast.error('Bạn đang có một phiên nhịn ăn chưa kết thúc.');
      } else {
        const msg =
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.title ||
          'Không thể bắt đầu phiên nhịn ăn. Vui lòng thử lại.';
        toast.error(msg);
      }
    },
  });
}

export function useEndFastingMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    EndFastingResult,
    AxiosError<ErrorResponse> | ProgressAuthError | ProgressDataIntegrityError | Error,
    EndFastingFormValues,
    ProgressMutationContext
  >({
    mutationFn: async (values) => {
      const session = getProgressSessionContext();
      if (!session) {
        throw new ProgressAuthError();
      }
      return progressApi.endFasting(values);
    },
    onMutate: async () => {
      const session = getProgressSessionContext();
      if (!session) {
        throw new ProgressAuthError();
      }
      return {
        initiatingUserId: session.userId,
        initiatingSessionId: session.sessionId,
      };
    },
    onSuccess: (result, _variables, context) => {
      if (
        !context ||
        !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)
      ) {
        return;
      }
      if (result.isGoalReached) {
        toast.success(
          `Chúc mừng! Bạn đã hoàn thành mục tiêu nhịn ăn (${result.formattedActualHours}).`
        );
      } else {
        toast.info(`Đã kết thúc phiên nhịn ăn (${result.formattedActualHours}).`);
      }
      queryClient.invalidateQueries({
        queryKey: progressKeys.fastingCurrent(context.initiatingUserId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.dashboard(context.initiatingUserId),
      });
    },
    onError: (error, _variables, context) => {
      if (error instanceof ProgressAuthError) {
        toast.error(error.message);
        return;
      }
      if (
        !context ||
        !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)
      ) {
        return;
      }
      if (error instanceof ProgressDataIntegrityError) {
        toast.error(error.message);
        return;
      }
      const axiosError = error as AxiosError<ErrorResponse>;
      const msg =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        'Không thể kết thúc phiên nhịn ăn. Vui lòng thử lại.';
      toast.error(msg);
    },
  });
}

export function useLogWaterMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    WaterSummary,
    AxiosError<ErrorResponse> | ProgressAuthError | ProgressDataIntegrityError | Error,
    LogWaterFormValues,
    ProgressMutationContext
  >({
    mutationFn: async (values) => {
      const session = getProgressSessionContext();
      if (!session) {
        throw new ProgressAuthError();
      }
      return progressApi.logWater(values);
    },
    onMutate: async () => {
      const session = getProgressSessionContext();
      if (!session) {
        throw new ProgressAuthError();
      }
      return {
        initiatingUserId: session.userId,
        initiatingSessionId: session.sessionId,
      };
    },
    onSuccess: (_data, variables, context) => {
      if (
        !context ||
        !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)
      ) {
        return;
      }
      toast.success(`Đã ghi nhận thêm ${variables.amountMl} ml nước uống.`);
      queryClient.invalidateQueries({
        queryKey: progressKeys.water(context.initiatingUserId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.dashboard(context.initiatingUserId),
      });
    },
    onError: (error, _variables, context) => {
      if (error instanceof ProgressAuthError) {
        toast.error(error.message);
        return;
      }
      if (
        !context ||
        !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)
      ) {
        return;
      }
      if (error instanceof ProgressDataIntegrityError) {
        toast.error(error.message);
        return;
      }
      const axiosError = error as AxiosError<ErrorResponse>;
      const msg =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.title ||
        'Không thể ghi nhận nước uống. Vui lòng thử lại.';
      toast.error(msg);
    },
  });
}

export function useLogSleepMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    SleepRecord,
    AxiosError<ErrorResponse> | ProgressAuthError | ProgressDataIntegrityError | Error,
    LogSleepFormValues,
    ProgressMutationContext
  >({
    mutationFn: async (values) => {
      const session = getProgressSessionContext();
      if (!session) {
        throw new ProgressAuthError();
      }
      return progressApi.logSleep(values);
    },
    onMutate: async () => {
      const session = getProgressSessionContext();
      if (!session) {
        throw new ProgressAuthError();
      }
      return {
        initiatingUserId: session.userId,
        initiatingSessionId: session.sessionId,
      };
    },
    onSuccess: (record, _variables, context) => {
      if (
        !context ||
        !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)
      ) {
        return;
      }
      toast.success(`Đã ghi nhận giấc ngủ (${record.formattedDuration}) thành công!`);
      queryClient.invalidateQueries({
        queryKey: progressKeys.dashboard(context.initiatingUserId),
      });
    },
    onError: (error, _variables, context) => {
      if (error instanceof ProgressAuthError) {
        toast.error(error.message);
        return;
      }
      if (
        !context ||
        !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)
      ) {
        return;
      }
      if (error instanceof ProgressDataIntegrityError) {
        toast.error(error.message);
        return;
      }
      const axiosError = error as AxiosError<ErrorResponse>;
      if (axiosError.response?.status === 409) {
        toast.error('Khoảng thời gian này đã trùng với một giấc ngủ đã được ghi nhận trước đó.');
      } else {
        const msg =
          axiosError.response?.data?.detail ||
          axiosError.response?.data?.title ||
          'Không thể ghi nhận giấc ngủ. Vui lòng kiểm tra lại thời gian.';
        toast.error(msg);
      }
    },
  });
}

export function useLogBodyMetricMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    BodyMetricRecord,
    AxiosError<ErrorResponse> | ProgressAuthError | ProgressDataIntegrityError | Error,
    LogBodyMetricFormValues,
    ProgressMutationContext
  >({
    mutationFn: async (values) => {
      const session = getProgressSessionContext();
      if (!session) {
        throw new ProgressAuthError();
      }
      return progressApi.logBodyMetric(values);
    },
    onMutate: async () => {
      const session = getProgressSessionContext();
      if (!session) {
        throw new ProgressAuthError();
      }
      return {
        initiatingUserId: session.userId,
        initiatingSessionId: session.sessionId,
      };
    },
    onSuccess: (record, _variables, context) => {
      if (
        !context ||
        !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)
      ) {
        return;
      }
      toast.success(`Đã lưu chỉ số cơ thể! BMI: ${record.bmi} (${record.bmiCategoryLabel}).`);
      queryClient.invalidateQueries({
        queryKey: progressKeys.dashboard(context.initiatingUserId),
      });
      queryClient.invalidateQueries({
        queryKey: progressKeys.metrics(context.initiatingUserId),
      });
    },
    onError: (error, _variables, context) => {
      if (error instanceof ProgressAuthError) {
        toast.error(error.message);
        return;
      }
      if (
        !context ||
        !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)
      ) {
        return;
      }
      if (error instanceof ProgressDataIntegrityError) {
        toast.error(error.message);
        return;
      }
      const axiosError = error as AxiosError<ErrorResponse>;
      const status = axiosError.response?.status;
      const errorData = axiosError.response?.data;
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
