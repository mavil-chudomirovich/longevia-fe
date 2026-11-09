export interface MealPlanCitationModel {
  chapterNumber: number;
  chapterTitle: string;
  bookPage: number;
  pdfPage: number;
  quote: string;
  verified: boolean;
  sourceFile: string;
}

export interface PlannedFoodModel {
  foodId: string;
  name: string;
  servingSize: string;
  servingUnit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  allergens: string[];
}

export interface PlannedMealModel {
  mealType: string;
  targetCalories: number;
  rationale: string;
  foods: PlannedFoodModel[];
  citations: MealPlanCitationModel[];
}

export interface PlanSuggestionModel {
  text: string;
  citations: MealPlanCitationModel[];
}

export interface MealPlanDayModel {
  date: string;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  targetFiberGrams: number;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFiberGrams: number;
  calorieCapReached: boolean;
  meals: PlannedMealModel[];
  suggestions: PlanSuggestionModel[];
}

export interface MealPlanWarningModel {
  code: string;
  message: string;
  scope: string;
}

export interface MealPlanModel {
  id: string;
  weekStartDate: string;
  daysRequested: number;
  mealsPerDay: number;
  weeklyTargetCalories: number;
  weeklyTargetProteinGrams: number;
  weeklyTargetCarbsGrams: number;
  weeklyTargetFatGrams: number;
  weeklyTargetFiberGrams: number;
  usedFallback: boolean;
  disclaimer: string;
  warnings: MealPlanWarningModel[];
  days: MealPlanDayModel[];
  generatedAt: Date | null;
}
