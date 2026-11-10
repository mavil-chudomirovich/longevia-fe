export interface FoodDto {
  id?: string;
  name?: string;
  category?: string;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  isCustom?: boolean;
  allergens?: string[] | null;
}

export interface FoodPageDto {
  items?: FoodDto[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export interface CreateFoodDto {
  name: string;
  category: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  allergens: string[];
}

export interface TargetDto {
  id?: string;
  bmr?: number | null;
  tdee?: number | null;
  targetCalories?: number;
  targetProteinGrams?: number;
  targetCarbsGrams?: number;
  targetFatGrams?: number;
  updatedAt?: string;
}

export interface MacroProgressDto {
  consumed?: number;
  target?: number;
  remaining?: number;
}
export interface MealItemDto {
  foodId?: string;
  name?: string;
  servingUnit?: string;
  quantity?: number;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
}

export interface MealSummaryDto {
  mealType?: string;
  totalCalories?: number;
  itemsCount?: number;
  items?: MealItemDto[] | null;
}
export interface DailySummaryDto {
  date?: string;
  targetCalories?: number;
  consumedCalories?: number;
  remainingCalories?: number;
  macros?: { protein?: MacroProgressDto; carbs?: MacroProgressDto; fat?: MacroProgressDto };
  meals?: MealSummaryDto[];
}

export interface MealCitationDto {
  chapterNumber?: number;
  chapterTitle?: string;
  bookPage?: number;
  pdfPage?: number;
  quote?: string;
  verified?: boolean;
  sourceFile?: string;
}
export interface MealSuggestionDto {
  foodId?: string;
  name?: string;
  servingSize?: number;
  servingUnit?: string;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  description?: string;
  rationale?: string;
  citations?: MealCitationDto[];
}
export interface RecommendationsDto {
  remainingCalories?: number;
  recommendedMeals?: MealSuggestionDto[];
  longevityTip?: string;
  tipCitations?: MealCitationDto[];
  disclaimer?: string;
  calorieCapReached?: boolean;
  safetyNote?: string;
}
export interface LogMealDto {
  date: string;
  mealType: string;
  items: { foodId: string; quantity: number }[];
}

export interface SuggestedTargetsDto {
  targetCalories?: number;
  targetProteinGrams?: number;
  targetCarbsGrams?: number;
  targetFatGrams?: number;
  rationale?: string;
  source?: string;
  safetyNote?: string;
}
