export interface MealPlanCitationDto {
  chapterNumber?: number;
  chapterTitle?: string;
  bookPage?: number;
  pdfPage?: number;
  quote?: string;
  verified?: boolean;
  sourceFile?: string;
}

export interface PlannedFoodDto {
  foodId?: string;
  name?: string;
  servingSize?: string;
  servingUnit?: string;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  allergens?: string[] | null;
}

export interface PlannedMealDto {
  mealType?: string;
  targetCalories?: number;
  rationale?: string;
  foods?: PlannedFoodDto[] | null;
  citations?: MealPlanCitationDto[] | null;
}

export interface PlanSuggestionDto {
  text?: string;
  citations?: MealPlanCitationDto[] | null;
}

export interface MealPlanDayDto {
  date?: string;
  targetCalories?: number;
  targetProteinGrams?: number;
  targetCarbsGrams?: number;
  targetFatGrams?: number;
  targetFiberGrams?: number;
  totalCalories?: number;
  totalProteinGrams?: number;
  totalCarbsGrams?: number;
  totalFatGrams?: number;
  totalFiberGrams?: number;
  calorieCapReached?: boolean;
  meals?: PlannedMealDto[] | null;
  suggestions?: PlanSuggestionDto[] | null;
}

export interface MealPlanWarningDto {
  code?: string;
  message?: string;
  scope?: string;
}

export interface MealPlanDto {
  id?: string;
  weekStartDate?: string;
  daysRequested?: number;
  mealsPerDay?: number;
  weeklyTargetCalories?: number;
  weeklyTargetProteinGrams?: number;
  weeklyTargetCarbsGrams?: number;
  weeklyTargetFatGrams?: number;
  weeklyTargetFiberGrams?: number;
  usedFallback?: boolean;
  usedFallbackReason?: string;
  disclaimer?: string;
  warnings?: MealPlanWarningDto[] | null;
  days?: MealPlanDayDto[] | null;
  generatedAt?: string;
}

export interface GenerateMealPlanDto {
  weekStartDate: string;
  days: number;
  mealsPerDay: number;
  excludedFoodIds?: string[];
}
