import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { progressAiMapper } from '../mappers/progress-ai.mapper';
import type { LongevityHabitsDto, WorkoutPlanDto } from '../types/progress-ai.dto';
import type { LongevityHabitsModel, WorkoutPlanModel } from '../types/progress-ai.model';

export const progressAiApi = {
  getWorkoutPlan: async (
    weekStartDate: string,
    signal?: AbortSignal
  ): Promise<WorkoutPlanModel> => {
    const response = await api.get<WorkoutPlanDto>(
      `${API_ENDPOINTS.PROGRESS.WORKOUT_PLANS}/${weekStartDate}`,
      { signal, silent: true }
    );
    return progressAiMapper.toWorkoutPlan(response.data);
  },
  generateWorkoutPlan: async (
    weekStartDate: string,
    goal: string,
    days: number,
    sessionsPerWeek: number,
    minutesPerSession: number,
    limitations: string[],
    equipmentAvailable: string[],
    signal: AbortSignal
  ): Promise<WorkoutPlanModel> => {
    const response = await api.post<WorkoutPlanDto>(
      API_ENDPOINTS.PROGRESS.WORKOUT_PLANS,
      progressAiMapper.toWorkoutRequest(
        weekStartDate,
        goal,
        days,
        sessionsPerWeek,
        minutesPerSession,
        limitations,
        equipmentAvailable
      ),
      { signal, silent: true, timeout: 150_000 }
    );
    return progressAiMapper.toWorkoutPlan(response.data);
  },
  getLongevity: async (days: number, signal?: AbortSignal): Promise<LongevityHabitsModel> => {
    const response = await api.get<LongevityHabitsDto>(API_ENDPOINTS.PROGRESS.LONGEVITY_HABITS, {
      params: { days },
      signal,
      silent: true,
    });
    return progressAiMapper.toLongevity(response.data);
  },
};
