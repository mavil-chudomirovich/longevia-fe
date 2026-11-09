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
  FastingHistoryPageModel,
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
import type { ProblemDetails } from '@/types/api';
import { toastFriendlyError } from '@/lib/api-error';
import { getUtcTodayDateString } from '../utils/progress-date';
import {
  getProgressSessionContext,
  isProgressSessionActive,
  registerSessionAbortController,
  unregisterSessionAbortController,
} from '../utils/progress-session';
import {
  ProgressAuthError,
  ProgressSessionObsoleteError,
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
  fastingHistory: (userId: string, page: number, pageSize: number) =>
    [...progressKeys.fasting(userId), 'history', page, pageSize] as const,
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

export function useFastingHistoryQuery(page: number, pageSize = 10, customUserId?: string) {
  const { userId, isEnabled } = useProgressAuth(customUserId);

  return useQuery<FastingHistoryPageModel>({
    queryKey: progressKeys.fastingHistory(userId, page, pageSize),
    queryFn: ({ signal }) => progressApi.getFastingHistory(page, pageSize, signal),
    enabled: isEnabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
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
  | AxiosError<ProblemDetails>
  | ProgressAuthError
  | ProgressSessionObsoleteError
  | ProgressDataIntegrityError
  | Error;

interface SessionMutationInput<TVariables> {
  values: TVariables;
  initiatingSession: { userId: string; sessionId: string };
  abortController: AbortController;
}

function handleProgressMutationError(
  error: unknown,
  context: ProgressMutationContext | undefined,
  defaultMessage: string
): void {
  // Lỗi do request bị abort khi chuyển tài khoản hoặc hủy phiên -> không hiển thị toast
  if (
    axios.isCancel(error) ||
    (error instanceof Error && error.name === 'AbortError') ||
    (error as { code?: string })?.code === 'ERR_CANCELED'
  ) {
    return;
  }

  // Nếu phiên đã thay đổi hoặc đã logout -> triệt tiêu toàn bộ toast thông báo của phiên cũ
  if (!context || !isProgressSessionActive(context.initiatingUserId, context.initiatingSessionId)) {
    return;
  }

  if (error instanceof ProgressAuthError) {
    // Không hiển thị toast cho lỗi phiên obsolete ngầm khi chuyển tài khoản
    if (error.code === 'PROGRESS_SESSION_OBSOLETE') {
      return;
    }
    toast.error(error.message);
    return;
  }

  if (error instanceof ProgressDataIntegrityError) {
    toast.error(error.message);
    return;
  }

  // Thông báo thân thiện theo mã lỗi (bảng dùng chung `FRIENDLY_ERRORS`), kèm nút khắc phục nếu có.
  toastFriendlyError(error, defaultMessage);
}

/**
 * Test seam interface dành riêng cho môi trường kiểm thử hành vi race condition.
 * KHÔNG sử dụng trong code production.
 */
export interface ProgressMutationTestSeams {
  beforeDispatch?: () => Promise<void> | void;
}

let progressMutationTestSeams: ProgressMutationTestSeams | null = null;

export function __setProgressMutationTestSeams(seams: ProgressMutationTestSeams | null): void {
  progressMutationTestSeams = seams;
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
      // Cho phép test seam can thiệp tạm dừng có kiểm soát trước khi dispatch (Finding B1)
      if (progressMutationTestSeams?.beforeDispatch) {
        await progressMutationTestSeams.beforeDispatch();
      }

      // Tái kiểm tra phiên NGAY TRƯỚC KHI gửi yêu cầu HTTP ra mạng
      if (!isProgressSessionActive(initiatingSession.userId, initiatingSession.sessionId)) {
        abortController.abort();
        throw new ProgressSessionObsoleteError();
      }
      return config.mutationFn(values, abortController.signal);
    },
    onMutate: async ({ initiatingSession }) => {
      if (!isProgressSessionActive(initiatingSession.userId, initiatingSession.sessionId)) {
        throw new ProgressSessionObsoleteError();
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
    onSettled: (_data, _error, input) => {
      // Dọn dẹp tài nguyên nội bộ: LUÔN chạy độc lập với việc consumer callbacks có bị triệt tiêu hay không
      if (input?.abortController && input?.initiatingSession?.sessionId) {
        unregisterSessionAbortController(input.initiatingSession.sessionId, input.abortController);
      }
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
        if (options?.onSettled) {
          options.onSettled(undefined, authError, values, undefined, {
            client: queryClient,
            meta: undefined,
          });
        }
        return;
      }
      const controller = new AbortController();
      const unregister = registerSessionAbortController(session.sessionId, controller);
      const initiatingUserId = session.userId;
      const initiatingSessionId = session.sessionId;

      mutation.mutate(
        { values, initiatingSession: session, abortController: controller },
        {
          onSuccess: (data, _vars, ctx, fnCtx) => {
            // Finding A: Chỉ thực thi per-call onSuccess nếu phiên khởi tạo vẫn active
            if (isProgressSessionActive(initiatingUserId, initiatingSessionId)) {
              try {
                options?.onSuccess?.(data, values, ctx, fnCtx);
              } catch (consumerError) {
                console.error('Progress mutation consumer onSuccess error:', consumerError);
              } finally {
                unregister();
              }
            }
          },
          onError: (err, _vars, ctx, fnCtx) => {
            // Finding A: Chỉ thực thi per-call onError nếu phiên khởi tạo vẫn active
            if (isProgressSessionActive(initiatingUserId, initiatingSessionId)) {
              try {
                options?.onError?.(err, values, ctx, fnCtx);
              } catch (consumerError) {
                console.error('Progress mutation consumer onError error:', consumerError);
              } finally {
                unregister();
              }
            }
          },
          onSettled: (data, err, _vars, ctx, fnCtx) => {
            unregister();
            // Finding A: Chỉ thực thi per-call onSettled nếu phiên khởi tạo vẫn active
            if (isProgressSessionActive(initiatingUserId, initiatingSessionId)) {
              try {
                options?.onSettled?.(data, err, values, ctx, fnCtx);
              } catch (consumerError) {
                console.error('Progress mutation consumer onSettled error:', consumerError);
              }
            }
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
      const initiatingUserId = session.userId;
      const initiatingSessionId = session.sessionId;

      try {
        const result = await mutation.mutateAsync(
          { values, initiatingSession: session, abortController: controller },
          {
            onSuccess: (data, _vars, ctx, fnCtx) => {
              // Finding A: Chỉ thực thi per-call onSuccess nếu phiên khởi tạo vẫn active
              if (isProgressSessionActive(initiatingUserId, initiatingSessionId)) {
                try {
                  options?.onSuccess?.(data, values, ctx, fnCtx);
                } catch (consumerError) {
                  console.error('Progress mutation consumer onSuccess error:', consumerError);
                }
              }
            },
            onError: (err, _vars, ctx, fnCtx) => {
              // Finding A: Chỉ thực thi per-call onError nếu phiên khởi tạo vẫn active
              if (isProgressSessionActive(initiatingUserId, initiatingSessionId)) {
                try {
                  options?.onError?.(err, values, ctx, fnCtx);
                } catch (consumerError) {
                  console.error('Progress mutation consumer onError error:', consumerError);
                }
              }
            },
            onSettled: (data, err, _vars, ctx, fnCtx) => {
              // Finding A: Chỉ thực thi per-call onSettled nếu phiên khởi tạo vẫn active
              if (isProgressSessionActive(initiatingUserId, initiatingSessionId)) {
                try {
                  options?.onSettled?.(data, err, values, ctx, fnCtx);
                } catch (consumerError) {
                  console.error('Progress mutation consumer onSettled error:', consumerError);
                }
              }
            },
          }
        );

        // Finding A (Post-settlement session validation):
        // Sau khi underlying Promise giải quyết thành công, xác thực lại phiên khởi tạo.
        // Ngăn chặn tuyệt đối việc trả về kết quả riêng tư của User A cho người gọi đang hoạt động dưới User B.
        if (!isProgressSessionActive(initiatingUserId, initiatingSessionId)) {
          throw new ProgressSessionObsoleteError();
        }

        return result;
      } catch (err) {
        // Nếu phiên khởi tạo đã trở nên obsolete trong quá trình thực thi:
        if (!isProgressSessionActive(initiatingUserId, initiatingSessionId)) {
          if (err instanceof ProgressAuthError) {
            throw err;
          }
          throw new ProgressSessionObsoleteError();
        }
        throw err;
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
        'Không thể bắt đầu phiên nhịn ăn. Vui lòng thử lại.'
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
        'Không thể kết thúc phiên nhịn ăn. Vui lòng thử lại.'
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
        'Không thể ghi nhận giấc ngủ. Vui lòng kiểm tra lại thời gian.'
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
      handleProgressMutationError(error, context, 'Không thể lưu chỉ số cơ thể. Vui lòng thử lại.');
    },
  });
}
