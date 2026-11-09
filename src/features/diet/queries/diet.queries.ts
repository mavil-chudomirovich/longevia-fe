import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { getApiErrorCode, toastFriendlyError } from '@/lib/api-error';
import {
  getProgressSessionContext,
  isProgressSessionActive,
  registerSessionAbortController,
} from '@/features/progress/utils/progress-session';
import { dietApi } from '../api/diet.api';
import type { CreateFoodValues, TargetFormValues } from '../schemas/diet.schema';

export const dietKeys = {
  all: ['diet'] as const,
  user: (userId: string) => [...dietKeys.all, userId] as const,
  foods: (userId: string, filters: { search?: string; category?: string; pageNumber?: number }) =>
    [...dietKeys.user(userId), 'foods', filters] as const,
  target: (userId: string) => [...dietKeys.user(userId), 'target'] as const,
  summary: (userId: string, date: string) => [...dietKeys.user(userId), 'summary', date] as const,
  recommendations: (userId: string, mealType: string, goal: string) =>
    [...dietKeys.user(userId), 'recommendations', mealType, goal] as const,
  mealPlan: (userId: string, weekStartDate: string) =>
    [...dietKeys.user(userId), 'meal-plan', weekStartDate] as const,
  nutrientGaps: (userId: string, days: number) =>
    [...dietKeys.user(userId), 'nutrient-gaps', days] as const,
};

function useDietSession() {
  const userId = useAuthStore((state) => state.user?.id);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return { userId, enabled: Boolean(authenticated && userId) };
}

class ObsoleteDietSessionError extends Error {}

export function useFoodsQuery(
  filters: { search?: string; category?: string; pageNumber?: number; pageSize?: number } = {}
) {
  const { userId, enabled } = useDietSession();
  return useQuery({
    queryKey: dietKeys.foods(userId ?? '', filters),
    queryFn: ({ signal }) => dietApi.getFoods(filters, signal),
    enabled,
  });
}

export function useDailySummaryQuery(date: string) {
  const { userId, enabled } = useDietSession();
  return useQuery({
    queryKey: dietKeys.summary(userId ?? '', date),
    queryFn: ({ signal }) => dietApi.getDailySummary(date, signal),
    enabled,
  });
}

export function useTargetQuery() {
  const { userId, enabled } = useDietSession();
  return useQuery({
    queryKey: dietKeys.target(userId ?? ''),
    queryFn: ({ signal }) => dietApi.getTarget(signal),
    enabled,
    retry: false,
  });
}

export function useRecommendationsQuery(mealType: string, goal: string, enabled: boolean) {
  const { userId, enabled: authenticated } = useDietSession();
  return useQuery({
    queryKey: dietKeys.recommendations(userId ?? '', mealType, goal),
    queryFn: ({ signal }) => dietApi.getRecommendations({ mealType, goal }, signal),
    enabled: enabled && authenticated,
    retry: false,
  });
}

export function useMealPlanQuery(weekStartDate: string, enabled: boolean) {
  const { userId, enabled: authenticated } = useDietSession();
  return useQuery({
    queryKey: dietKeys.mealPlan(userId ?? '', weekStartDate),
    queryFn: ({ signal }) => dietApi.getMealPlan(weekStartDate, signal),
    enabled: enabled && authenticated && Boolean(weekStartDate),
    retry: false,
  });
}

export function useNutrientGapsQuery(days: number, enabled = true) {
  const { userId, enabled: authenticated } = useDietSession();
  return useQuery({
    queryKey: dietKeys.nutrientGaps(userId ?? '', days),
    queryFn: ({ signal }) => dietApi.getNutrientGaps(days, signal),
    enabled: enabled && authenticated,
    retry: false,
  });
}

function useDietMutation<TValues, TResult>(
  mutationFn: (values: TValues, signal: AbortSignal) => Promise<TResult>,
  onSuccess: (data: TResult, userId: string) => void,
  /** `false` khi trang tự hiển thị lỗi tại chỗ (tránh báo lỗi hai lần). */
  options: { toastOnError?: boolean } = {}
) {
  const { toastOnError = true } = options;
  return useMutation({
    mutationFn: async (values: TValues) => {
      const session = getProgressSessionContext();
      if (!session) throw new Error('Bạn cần đăng nhập để tiếp tục.');
      const controller = new AbortController();
      const unregister = registerSessionAbortController(session.sessionId, controller);
      try {
        if (!isProgressSessionActive(session.userId, session.sessionId))
          throw new Error('Phiên đăng nhập đã thay đổi.');
        const data = await mutationFn(values, controller.signal);
        if (!isProgressSessionActive(session.userId, session.sessionId))
          throw new Error('Phiên đăng nhập đã thay đổi.');
        return { data, userId: session.userId, sessionId: session.sessionId };
      } catch (error) {
        if (!isProgressSessionActive(session.userId, session.sessionId))
          throw new ObsoleteDietSessionError();
        throw error;
      } finally {
        unregister();
      }
    },
    onSuccess: ({ data, userId, sessionId }) => {
      if (isProgressSessionActive(userId, sessionId)) onSuccess(data, userId);
    },
    onError: (error) => {
      if (toastOnError && !(error instanceof ObsoleteDietSessionError)) toastFriendlyError(error);
    },
    retry: false,
  });
}

export function useCreateFoodMutation() {
  const client = useQueryClient();
  return useDietMutation<CreateFoodValues, unknown>(dietApi.createFood, (_food, userId) => {
    void client.invalidateQueries({ queryKey: dietKeys.user(userId) });
    toast.success('Đã thêm món ăn.');
  });
}

export function useSaveTargetMutation() {
  const client = useQueryClient();
  return useDietMutation<TargetFormValues, unknown>(
    dietApi.saveTarget,
    (_target, userId) => {
      void client.invalidateQueries({ queryKey: dietKeys.target(userId) });
      void client.invalidateQueries({ queryKey: [...dietKeys.user(userId), 'summary'] });
      toast.success('Đã lưu mục tiêu dinh dưỡng.');
    },
    { toastOnError: false }
  );
}

export function useCalculateTargetMutation() {
  const client = useQueryClient();
  return useDietMutation<TargetFormValues, Awaited<ReturnType<typeof dietApi.calculateTarget>>>(
    dietApi.calculateTarget,
    (_target, userId) => {
      void client.invalidateQueries({ queryKey: dietKeys.target(userId) });
      toast.success('Đã tính và lưu mục tiêu từ hồ sơ của bạn.');
    },
    { toastOnError: false }
  );
}

export function useLogMealMutation() {
  const client = useQueryClient();
  return useDietMutation<
    { date: string; mealType: string; items: { foodId: string; quantity: number }[] },
    void
  >(dietApi.logMeal, (_result, userId) => {
    void client.invalidateQueries({ queryKey: [...dietKeys.user(userId), 'summary'] });
    toast.success('Đã ghi bữa ăn vào nhật ký.');
  });
}

export function useGenerateMealPlanMutation() {
  const client = useQueryClient();
  return useDietMutation<
    { weekStartDate: string; days: number; mealsPerDay: number },
    Awaited<ReturnType<typeof dietApi.generateMealPlan>>
  >(
    (values, signal) =>
      dietApi.generateMealPlan(values.weekStartDate, values.days, values.mealsPerDay, signal),
    (_plan, userId) => {
      void client.invalidateQueries({ queryKey: [...dietKeys.user(userId), 'meal-plan'] });
      toast.success('Đã tạo và lưu kế hoạch ăn uống.');
    }
  );
}

export function isDietProfileError(error: unknown): boolean {
  const code = getApiErrorCode(error);
  return code === 'diet.profile_not_found' || code === 'diet.profile_incomplete';
}
