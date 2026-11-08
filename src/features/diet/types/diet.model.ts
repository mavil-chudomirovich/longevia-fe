export interface FoodModel {
  id: string;
  name: string;
  category: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  isCustom: boolean;
  allergens: string[] | null;
}
export interface FoodPageModel {
  items: FoodModel[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
export interface TargetModel {
  id: string;
  bmr: number | null;
  tdee: number | null;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  updatedAt: Date | null;
}
export interface MacroProgressModel {
  consumed: number;
  target: number;
  remaining: number;
}
export interface DailySummaryModel {
  date: string;
  targetCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  macros: { protein: MacroProgressModel; carbs: MacroProgressModel; fat: MacroProgressModel };
  meals: { mealType: string; totalCalories: number; itemsCount: number }[];
}
export interface MealCitationModel {
  chapterNumber: number;
  chapterTitle: string;
  bookPage: number;
  pdfPage: number;
  quote: string;
  verified: boolean;
  sourceFile: string;
}
export interface MealSuggestionModel {
  foodId: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  description: string;
  rationale: string;
  citations: MealCitationModel[];
}
export interface RecommendationsModel {
  remainingCalories: number;
  recommendedMeals: MealSuggestionModel[];
  longevityTip: string;
  tipCitations: MealCitationModel[];
  disclaimer: string;
  calorieCapReached: boolean;
  safetyNote: string;
}
