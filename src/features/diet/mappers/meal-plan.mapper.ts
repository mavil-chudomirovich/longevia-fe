import { pickField, safeArray, safeBoolean, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type {
  GenerateMealPlanDto,
  MealPlanCitationDto,
  MealPlanDayDto,
  MealPlanDto,
  MealPlanWarningDto,
  PlannedFoodDto,
  PlannedMealDto,
  PlanSuggestionDto,
} from '../types/meal-plan.dto';
import type {
  MealPlanCitationModel,
  MealPlanDayModel,
  MealPlanModel,
  MealPlanWarningModel,
  PlannedFoodModel,
  PlannedMealModel,
  PlanSuggestionModel,
} from '../types/meal-plan.model';

const citation = (dto: MealPlanCitationDto): MealPlanCitationModel => ({
  chapterNumber: safeNumber(pickField(dto, ['chapterNumber'], 0)),
  chapterTitle: safeString(pickField(dto, ['chapterTitle'], '')),
  bookPage: safeNumber(pickField(dto, ['bookPage'], 0)),
  pdfPage: safeNumber(pickField(dto, ['pdfPage'], 0)),
  quote: safeString(pickField(dto, ['quote'], '')),
  verified: safeBoolean(pickField(dto, ['verified'], false)),
  sourceFile: safeString(pickField(dto, ['sourceFile'], '')),
});

const citations = (value: MealPlanCitationDto[] | null | undefined): MealPlanCitationModel[] =>
  safeArray<MealPlanCitationDto>(value ?? []).map(citation);

const food = (dto: PlannedFoodDto): PlannedFoodModel => ({
  foodId: safeString(pickField(dto, ['foodId'], '')),
  name: safeString(pickField(dto, ['name'], '')),
  servingSize: safeString(pickField(dto, ['servingSize'], '')),
  servingUnit: safeString(pickField(dto, ['servingUnit'], '')),
  calories: safeNumber(pickField(dto, ['calories'], 0)),
  proteinGrams: safeNumber(pickField(dto, ['proteinGrams'], 0)),
  carbsGrams: safeNumber(pickField(dto, ['carbsGrams'], 0)),
  fatGrams: safeNumber(pickField(dto, ['fatGrams'], 0)),
  fiberGrams: safeNumber(pickField(dto, ['fiberGrams'], 0)),
  allergens: safeArray<string>(dto.allergens ?? []),
});

const meal = (dto: PlannedMealDto): PlannedMealModel => ({
  mealType: safeString(pickField(dto, ['mealType'], '')),
  targetCalories: safeNumber(pickField(dto, ['targetCalories'], 0)),
  rationale: safeString(pickField(dto, ['rationale'], '')),
  foods: safeArray<PlannedFoodDto>(dto.foods ?? []).map(food),
  citations: citations(dto.citations),
});

const suggestion = (dto: PlanSuggestionDto): PlanSuggestionModel => ({
  text: safeString(pickField(dto, ['text'], '')),
  citations: citations(dto.citations),
});

const day = (dto: MealPlanDayDto): MealPlanDayModel => ({
  date: safeString(pickField(dto, ['date'], '')),
  targetCalories: safeNumber(pickField(dto, ['targetCalories'], 0)),
  targetProteinGrams: safeNumber(pickField(dto, ['targetProteinGrams'], 0)),
  targetCarbsGrams: safeNumber(pickField(dto, ['targetCarbsGrams'], 0)),
  targetFatGrams: safeNumber(pickField(dto, ['targetFatGrams'], 0)),
  targetFiberGrams: safeNumber(pickField(dto, ['targetFiberGrams'], 0)),
  totalCalories: safeNumber(pickField(dto, ['totalCalories'], 0)),
  totalProteinGrams: safeNumber(pickField(dto, ['totalProteinGrams'], 0)),
  totalCarbsGrams: safeNumber(pickField(dto, ['totalCarbsGrams'], 0)),
  totalFatGrams: safeNumber(pickField(dto, ['totalFatGrams'], 0)),
  totalFiberGrams: safeNumber(pickField(dto, ['totalFiberGrams'], 0)),
  calorieCapReached: safeBoolean(pickField(dto, ['calorieCapReached'], false)),
  meals: safeArray<PlannedMealDto>(dto.meals ?? []).map(meal),
  suggestions: safeArray<PlanSuggestionDto>(dto.suggestions ?? []).map(suggestion),
});

const warning = (dto: MealPlanWarningDto): MealPlanWarningModel => ({
  code: safeString(pickField(dto, ['code'], '')),
  message: safeString(pickField(dto, ['message'], '')),
  scope: safeString(pickField(dto, ['scope'], '')),
});

export const mealPlanMapper = {
  toModel(dto: MealPlanDto | null | undefined): MealPlanModel {
    return {
      id: safeString(pickField(dto, ['id'], '')),
      weekStartDate: safeString(pickField(dto, ['weekStartDate'], '')),
      daysRequested: safeNumber(pickField(dto, ['daysRequested'], 0)),
      mealsPerDay: safeNumber(pickField(dto, ['mealsPerDay'], 0)),
      weeklyTargetCalories: safeNumber(pickField(dto, ['weeklyTargetCalories'], 0)),
      weeklyTargetProteinGrams: safeNumber(pickField(dto, ['weeklyTargetProteinGrams'], 0)),
      weeklyTargetCarbsGrams: safeNumber(pickField(dto, ['weeklyTargetCarbsGrams'], 0)),
      weeklyTargetFatGrams: safeNumber(pickField(dto, ['weeklyTargetFatGrams'], 0)),
      weeklyTargetFiberGrams: safeNumber(pickField(dto, ['weeklyTargetFiberGrams'], 0)),
      usedFallback: safeBoolean(pickField(dto, ['usedFallback'], false)),
      usedFallbackReason: safeString(pickField(dto, ['usedFallbackReason'], '')) || null,
      disclaimer: safeString(pickField(dto, ['disclaimer'], '')),
      warnings: safeArray<MealPlanWarningDto>(dto?.warnings ?? []).map(warning),
      days: safeArray<MealPlanDayDto>(dto?.days ?? []).map(day),
      generatedAt: safeDate(pickField(dto, ['generatedAt'], null)),
    };
  },
  toRequest(weekStartDate: string, days: number, mealsPerDay: number): GenerateMealPlanDto {
    return { weekStartDate, days, mealsPerDay };
  },
};
