import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { dietMapper } from '../mappers/diet.mapper';
import type {
  CreateFoodDto,
  DailySummaryDto,
  FoodPageDto,
  FoodDto,
  LogMealDto,
  RecommendationsDto,
  TargetDto,
} from '../types/diet.dto';
import type { CreateFoodValues, TargetFormValues } from '../schemas/diet.schema';
import type {
  DailySummaryModel,
  FoodModel,
  FoodPageModel,
  RecommendationsModel,
  TargetModel,
} from '../types/diet.model';

export const dietApi = {
  getFoods: async (
    params: { search?: string; category?: string; pageNumber?: number; pageSize?: number },
    signal?: AbortSignal
  ): Promise<FoodPageModel> => {
    const response = await api.get<FoodPageDto>(API_ENDPOINTS.DIET.FOODS, { params, signal });
    return dietMapper.toFoodPage(response.data);
  },
  createFood: async (values: CreateFoodValues, signal: AbortSignal): Promise<FoodModel> => {
    const response = await api.post<FoodDto>(
      API_ENDPOINTS.DIET.FOODS,
      dietMapper.toCreateFoodDto(values),
      { signal, silent: true }
    );
    return dietMapper.toModel(response.data);
  },
  getTarget: async (signal?: AbortSignal): Promise<TargetModel> => {
    const response = await api.get<TargetDto>(API_ENDPOINTS.DIET.TARGETS_ME, { signal });
    return dietMapper.toTarget(response.data);
  },
  saveTarget: async (values: TargetFormValues, signal: AbortSignal): Promise<TargetModel> => {
    const response = await api.put<TargetDto>(
      API_ENDPOINTS.DIET.TARGETS_ME,
      dietMapper.toTargetDto(values),
      { signal, silent: true }
    );
    return dietMapper.toTarget(response.data);
  },
  calculateTarget: async (values: TargetFormValues, signal: AbortSignal): Promise<TargetModel> => {
    const response = await api.post<TargetDto>(
      API_ENDPOINTS.DIET.CALCULATE_TARGETS,
      dietMapper.toTargetDto(values),
      { signal, silent: true }
    );
    return dietMapper.toTarget(response.data);
  },
  getDailySummary: async (date: string, signal?: AbortSignal): Promise<DailySummaryModel> => {
    const response = await api.get<DailySummaryDto>(API_ENDPOINTS.DIET.DAILY_SUMMARY, {
      params: { date },
      signal,
    });
    return dietMapper.toSummary(response.data);
  },
  logMeal: async (payload: LogMealDto, signal: AbortSignal): Promise<void> => {
    await api.post(API_ENDPOINTS.DIET.MEALS, payload, { signal, silent: true });
  },
  getRecommendations: async (
    params: { mealType: string; goal: string },
    signal?: AbortSignal
  ): Promise<RecommendationsModel> => {
    const response = await api.get<RecommendationsDto>(API_ENDPOINTS.DIET.AI_RECOMMENDATIONS, {
      params,
      signal,
    });
    return dietMapper.toRecommendations(response.data);
  },
};
