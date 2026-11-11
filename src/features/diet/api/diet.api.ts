import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { dietMapper } from '../mappers/diet.mapper';
import { mealPlanMapper } from '../mappers/meal-plan.mapper';
import { nutritionMapper } from '../mappers/nutrition.mapper';
import type {
  CreateFoodDto,
  DailySummaryDto,
  FoodPageDto,
  FoodDto,
  LogMealDto,
  RecommendationsDto,
  SuggestedTargetsDto,
  TargetDto,
} from '../types/diet.dto';
import type { MealPlanDto, GenerateMealPlanDto } from '../types/meal-plan.dto';
import type { NutrientGapDto } from '../types/nutrition.dto';
import type { CreateFoodValues, TargetFormValues } from '../schemas/diet.schema';
import type {
  DailySummaryModel,
  FoodModel,
  FoodPageModel,
  RecommendationsModel,
  SuggestedTargetsModel,
  TargetModel,
} from '../types/diet.model';
import type { MealPlanModel } from '../types/meal-plan.model';
import type { NutrientGapModel } from '../types/nutrition.model';

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
  updateFood: async (
    id: string,
    values: CreateFoodValues,
    signal: AbortSignal
  ): Promise<FoodModel> => {
    const response = await api.put<FoodDto>(
      `${API_ENDPOINTS.DIET.FOODS}/${id}`,
      dietMapper.toCreateFoodDto(values),
      { signal, silent: true }
    );
    return dietMapper.toModel(response.data);
  },
  deleteFood: async (id: string, signal: AbortSignal): Promise<void> => {
    await api.delete(`${API_ENDPOINTS.DIET.FOODS}/${id}`, { signal, silent: true });
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
  autoTarget: async (goal: string, signal: AbortSignal): Promise<TargetModel> => {
    const response = await api.post<TargetDto>(
      API_ENDPOINTS.DIET.AUTO_TARGETS,
      { goal },
      { signal, silent: true }
    );
    return dietMapper.toTarget(response.data);
  },
  suggestTargets: async (
    input: { description: string; goal: string },
    signal: AbortSignal
  ): Promise<SuggestedTargetsModel> => {
    const response = await api.post<SuggestedTargetsDto>(
      API_ENDPOINTS.DIET.SUGGEST_TARGETS,
      input,
      // BE dành tới 20s cho Recommendation, provider có thể tới 30s; client
      // phải chờ lâu hơn để không huỷ ngang (trước đây timeout 15s gây lỗi oan).
      { signal, silent: true, timeout: 60_000 }
    );
    return dietMapper.toSuggestedTargets(response.data);
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
  replaceMeal: async (payload: LogMealDto, signal: AbortSignal): Promise<void> => {
    await api.put(
      API_ENDPOINTS.DIET.MEALS,
      { items: payload.items },
      {
        params: { date: payload.date, mealType: payload.mealType },
        signal,
        silent: true,
      }
    );
  },
  deleteMeal: async (date: string, mealType: string, signal: AbortSignal): Promise<void> => {
    await api.delete(API_ENDPOINTS.DIET.MEALS, {
      params: { date, mealType },
      signal,
      silent: true,
    });
  },
  getRecommendations: async (
    params: { mealType: string; goal: string },
    signal?: AbortSignal
  ): Promise<RecommendationsModel> => {
    // Trang Gợi ý AI tự hiển thị lỗi tại chỗ (kèm nút khắc phục) -> không toast tự động.
    const response = await api.get<RecommendationsDto>(API_ENDPOINTS.DIET.AI_RECOMMENDATIONS, {
      params,
      signal,
      silent: true,
      // Gợi ý bữa ăn cũng đi qua Recommendation (budget 20s, provider tới 30s).
      timeout: 60_000,
    });
    return dietMapper.toRecommendations(response.data);
  },
  getMealPlan: async (weekStartDate: string, signal?: AbortSignal): Promise<MealPlanModel> => {
    const response = await api.get<MealPlanDto>(
      `${API_ENDPOINTS.DIET.MEAL_PLANS}/${weekStartDate}`,
      {
        signal,
        silent: true,
      }
    );
    return mealPlanMapper.toModel(response.data);
  },
  generateMealPlan: async (
    weekStartDate: string,
    days: number,
    mealsPerDay: number,
    signal: AbortSignal
  ): Promise<MealPlanModel> => {
    const payload: GenerateMealPlanDto = mealPlanMapper.toRequest(weekStartDate, days, mealsPerDay);
    const response = await api.post<MealPlanDto>(API_ENDPOINTS.DIET.MEAL_PLANS, payload, {
      signal,
      silent: true,
      timeout: 150_000,
    });
    return mealPlanMapper.toModel(response.data);
  },
  getNutrientGaps: async (days: number, signal?: AbortSignal): Promise<NutrientGapModel> => {
    const response = await api.get<NutrientGapDto>(API_ENDPOINTS.DIET.NUTRIENT_GAPS, {
      params: { days },
      signal,
      silent: true,
      timeout: 60_000,
    });
    return nutritionMapper.toModel(response.data);
  },
};
