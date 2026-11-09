import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { progressAiApi } from '../api/progress-ai.api';

export const progressAiKeys = {
  all: ['progress-ai'] as const,
  workout: (userId: string, weekStartDate: string) =>
    [...progressAiKeys.all, 'workout', userId, weekStartDate] as const,
  longevity: (userId: string, days: number) =>
    [...progressAiKeys.all, 'longevity', userId, days] as const,
};

function useProgressAiSession() {
  const userId = useAuthStore((state) => state.user?.id);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return { userId: userId ?? '', enabled: Boolean(authenticated && userId) };
}

export function useWorkoutPlanQuery(weekStartDate: string, enabled: boolean) {
  const { userId, enabled: authenticated } = useProgressAiSession();
  return useQuery({
    queryKey: progressAiKeys.workout(userId, weekStartDate),
    queryFn: ({ signal }) => progressAiApi.getWorkoutPlan(weekStartDate, signal),
    enabled: enabled && authenticated && Boolean(weekStartDate),
    retry: false,
  });
}

export function useGenerateWorkoutPlanMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      weekStartDate: string;
      goal: string;
      days: number;
      sessionsPerWeek: number;
      minutesPerSession: number;
    }) => {
      const controller = new AbortController();
      return progressAiApi.generateWorkoutPlan(
        input.weekStartDate,
        input.goal,
        input.days,
        input.sessionsPerWeek,
        input.minutesPerSession,
        controller.signal
      );
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: progressAiKeys.all });
      toast.success('Đã tạo kế hoạch tập.');
    },
    retry: false,
  });
}

export function useLongevityQuery(days: number) {
  const { userId, enabled } = useProgressAiSession();
  return useQuery({
    queryKey: progressAiKeys.longevity(userId, days),
    queryFn: ({ signal }) => progressAiApi.getLongevity(days, signal),
    enabled,
    retry: false,
  });
}
