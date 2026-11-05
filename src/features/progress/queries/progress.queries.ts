import * as React from 'react';
import {
  MutateOptions,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import axios, { AxiosError } from 'axios';
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
import {
  getProgressSessionContext,
  isProgressSessionActive,
  registerSessionAbortController,
} from '../utils/progress-session';
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

export type ProgressMutationError =
  AxiosError<ErrorResponse> | ProgressAuthError | ProgressDataIntegrityError | Error;

interface SessionMutationInput<TVariables> {
  values: TVariables;
  initiatingSession: { userId: string; sessionId: string };
  abortController: AbortController;
}

function handleProgressMutationError(
  error: unknown,
  context: ProgressMutationContext | undefined,
  defaultMessage: string,
  customStatusHandlers?: (status?: number, detail?: string) => string | null
): void {
  // Lỗi do request bị abort khi chuyển tài khoản hoặc hủy phiên -> không hiển thị toast
  if (
    axios.isCancel(error) ||
    (error instanceof Error && error.name === 'AbortError') ||
    (error as any)?.code === 'ERR_CANCELED'
  ) {
    return;
  }

  // Nếu phiên đã thay đổi hoặc đã logout -> triệt tiêu toàn bộ toast thông báo của phiên cũ
  if (!context || !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)) {
    return;
  }

  if (error instanceof ProgressAuthError) {
    toast.error(error.message);
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

  if (customStatusHandlers) {
    const customMsg = customStatusHandlers(status, detail);
    if (customMsg) {
      toast.error(customMsg);
      return;
    }
  }

  if (status && status >= 500) {
    if (status === 502) {
      toast.error('Lỗi kết nối với dịch vụ máy chủ (502 Gateway). Vui lòng thử lại sau.');
    } else if (status === 503) {
      toast.error(
        'Dịch vụ tạm thời không khả dụng (503 Service Unavailable). Vui lòng thử lại sau ít phút.'
      );
    } else {
      toast.error('Lỗi hệ thống máy chủ. Vui lòng thử lại sau.');
    }
  } else if (status === 403) {
    toast.error(errorData?.message || detail || 'Bạn không có quyền thực hiện thao tác này.');
  } else if (status === 429) {
    toast.error('Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau.');
  } else if (axiosError.request && !axiosError.response) {
    toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.');
  } else {
    toast.error(detail || errorData?.title || errorData?.message || defaultMessage);
  }
}

function useSessionBoundMutation<TData, TVariables>(config: {
  mutationFn: (values: TVariables, signal: AbortSignal) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables, context: ProgressMutationContext) => void;
  onError?: (
    error: ProgressMutationError,
    variables: TVariables,
    context: ProgressMutationContext | undefined
  ) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    TData,
    ProgressMutationError,
    SessionMutationInput<TVariables>,
    ProgressMutationContext
  >({
    mutationFn: async ({ values, initiatingSession, abortController }) => {
      // Tái kiểm tra phiên NGAY TRƯỚC KHI gửi yêu cầu HTTP ra mạng
      if (!isProgressSessionActive(initiatingSession.userId, initiatingSession.sessionId)) {
        abortController.abort();
        throw new ProgressAuthError();
      }
      return config.mutationFn(values, abortController.signal);
    },
    onMutate: async ({ initiatingSession }) => {
      if (!isProgressSessionActive(initiatingSession.userId, initiatingSession.sessionId)) {
        throw new ProgressAuthError();
      }
      return {
        initiatingUserId: initiatingSession.userId,
        initiatingSessionId: initiatingSession.sessionId,
      };
    },
    onSuccess: (data, input, context) => {
      config.onSuccess?.(data, input.values, context);
    },
    onError: (error, input, context) => {
      config.onError?.(error, input.values, context);
    },
  });

  const mutate = React.useCallback(
    (
      values: TVariables,
      options?: MutateOptions<TData, ProgressMutationError, TVariables, ProgressMutationContext>
    ) => {
      const session = getProgressSessionContext();
      if (!session) {
        const authError = new ProgressAuthError();
        toast.error(authError.message);
        if (options?.onError) {
          options.onError(authError, values, undefined, {
            client: queryClient,
            meta: undefined,
          });
        }
        return;
      }
      const controller = new AbortController();
      const unregister = registerSessionAbortController(session.sessionId, controller);
      mutation.mutate(
        { values, initiatingSession: session, abortController: controller },
        {
          onSuccess: (data, _vars, ctx, fnCtx) => {
            unregister();
            options?.onSuccess?.(data, values, ctx, fnCtx);
          },
          onError: (err, _vars, ctx, fnCtx) => {
            unregister();
            options?.onError?.(err, values, ctx, fnCtx);
          },
          onSettled: (data, err, _vars, ctx, fnCtx) => {
            unregister();
            options?.onSettled?.(data, err, values, ctx, fnCtx);
          },
        }
      );
    },
    [mutation, queryClient]
  );

  const mutateAsync = React.useCallback(
    async (
      values: TVariables,
      options?: MutateOptions<TData, ProgressMutationError, TVariables, ProgressMutationContext>
    ): Promise<TData> => {
      const session = getProgressSessionContext();
      if (!session) {
        const authError = new ProgressAuthError();
        toast.error(authError.message);
        throw authError;
      }
      const controller = new AbortController();
      const unregister = registerSessionAbortController(session.sessionId, controller);
      try {
        return await mutation.mutateAsync(
          { values, initiatingSession: session, abortController: controller },
          {
            onSuccess: (data, _vars, ctx, fnCtx) => {
              unregister();
              options?.onSuccess?.(data, values, ctx, fnCtx);
            },
            onError: (err, _vars, ctx, fnCtx) => {
              unregister();
              options?.onError?.(err, values, ctx, fnCtx);
            },
            onSettled: (data, err, _vars, ctx, fnCtx) => {
              unregister();
              options?.onSettled?.(data, err, values, ctx, fnCtx);
            },
          }
        );
      } finally {
        unregister();
      }
    },
    [mutation]
  );

  return React.useMemo(
    () => ({
      ...mutation,
      mutate,
      mutateAsync,
    }),
    [mutation, mutate, mutateAsync]
  );
}

export function useStartFastingMutation() {
  const queryClient = useQueryClient();

  return useSessionBoundMutation<FastingSessionResult, StartFastingFormValues>({
    mutationFn: (values, signal) => progressApi.startFasting(values, signal),
    onSuccess: (_result, _variables, context) => {
      if (!isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)) {
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
      handleProgressMutationError(
        error,
        context,
        'Không thể bắt đầu phiên nhịn ăn. Vui lòng thử lại.',
        (status) => {
          if (status === 409) {
            return 'Bạn đang có một phiên nhịn ăn chưa kết thúc.';
          }
          return null;
        }
      );
    },
  });
}

export function useEndFastingMutation() {
  const queryClient = useQueryClient();

  return useSessionBoundMutation<EndFastingResult, EndFastingFormValues>({
    mutationFn: (values, signal) => progressApi.endFasting(values, signal),
    onSuccess: (result, _variables, context) => {
      if (!isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)) {
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
      handleProgressMutationError(
        error,
        context,
        'Không thể kết thúc phiên nhịn ăn. Vui lòng thử lại.',
        (status) => {
          if (status === 404) {
            return 'Không tìm thấy phiên nhịn ăn để kết thúc.';
          }
          return null;
        }
      );
    },
  });
}

export function useLogWaterMutation() {
  const queryClient = useQueryClient();

  return useSessionBoundMutation<WaterSummary, LogWaterFormValues>({
    mutationFn: (values, signal) => progressApi.logWater(values, signal),
    onSuccess: (_data, variables, context) => {
      if (!isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)) {
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
      handleProgressMutationError(
        error,
        context,
        'Không thể ghi nhận nước uống. Vui lòng thử lại.'
      );
    },
  });
}

export function useLogSleepMutation() {
  const queryClient = useQueryClient();

  return useSessionBoundMutation<SleepRecord, LogSleepFormValues>({
    mutationFn: (values, signal) => progressApi.logSleep(values, signal),
    onSuccess: (record, _variables, context) => {
      if (!isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)) {
        return;
      }
      toast.success(`Đã ghi nhận giấc ngủ (${record.formattedDuration}) thành công!`);
      queryClient.invalidateQueries({
        queryKey: progressKeys.dashboard(context.initiatingUserId),
      });
    },
    onError: (error, _variables, context) => {
      handleProgressMutationError(
        error,
        context,
        'Không thể ghi nhận giấc ngủ. Vui lòng kiểm tra lại thời gian.',
        (status) => {
          if (status === 409) {
            return 'Khoảng thời gian này đã trùng với một giấc ngủ đã được ghi nhận trước đó.';
          }
          return null;
        }
      );
    },
  });
}

export function useLogBodyMetricMutation() {
  const queryClient = useQueryClient();

  return useSessionBoundMutation<BodyMetricRecord, LogBodyMetricFormValues>({
    mutationFn: (values, signal) => progressApi.logBodyMetric(values, signal),
    onSuccess: (record, _variables, context) => {
      if (!isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)) {
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
      handleProgressMutationError(
        error,
        context,
        'Không thể lưu chỉ số cơ thể. Vui lòng thử lại.',
        (status, detail) => {
          if (status === 422 || (detail && detail.includes('height_unavailable'))) {
            return 'Hồ sơ của bạn chưa có thông tin chiều cao. Vui lòng cập nhật chiều cao trong trang Hồ sơ cá nhân để tính BMI.';
          }
          if (status === 503 || (detail && detail.includes('identity_unavailable'))) {
            return 'Dịch vụ thông tin hồ sơ tạm thời không khả dụng. Vui lòng thử lại sau ít phút.';
          }
          if (status === 502 || (detail && detail.includes('identity_integration_failure'))) {
            return 'Lỗi kết nối với dịch vụ hồ sơ. Vui lòng liên hệ quản trị viên nếu tình trạng tiếp diễn.';
          }
          return null;
        }
      );
    },
  });
}
