import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeDate,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { CreateFoodValues, TargetFormValues } from '../schemas/diet.schema';
import type {
  CreateFoodDto,
  DailySummaryDto,
  FoodDto,
  FoodPageDto,
  MacroProgressDto,
  MealCitationDto,
  MealSummaryDto,
  MealSuggestionDto,
  RecommendationsDto,
  SuggestedTargetsDto,
  TargetDto,
} from '../types/diet.dto';
import type {
  DailySummaryModel,
  FoodModel,
  FoodPageModel,
  MacroProgressModel,
  MealCitationModel,
  MealSuggestionModel,
  RecommendationsModel,
  SuggestedTargetsModel,
  TargetModel,
} from '../types/diet.model';

export class DietMapper extends BaseMapper<FoodDto, FoodModel> {
  toModel(dto: FoodDto | null | undefined): FoodModel {
    const allergens = pickField<string[] | null>(dto, ['allergens'], null);
    return {
      id: safeString(pickField(dto, ['id'], '')),
      name: safeString(pickField(dto, ['name'], '')),
      category: safeString(pickField(dto, ['category'], '')),
      servingSize: safeNumber(pickField(dto, ['servingSize'], 0)),
      servingUnit: safeString(pickField(dto, ['servingUnit'], '')),
      calories: safeNumber(pickField(dto, ['calories'], 0)),
      proteinGrams: safeNumber(pickField(dto, ['proteinGrams'], 0)),
      carbsGrams: safeNumber(pickField(dto, ['carbsGrams'], 0)),
      fatGrams: safeNumber(pickField(dto, ['fatGrams'], 0)),
      fiberGrams: safeNumber(pickField(dto, ['fiberGrams'], 0)),
      isCustom: safeBoolean(pickField(dto, ['isCustom'], false)),
      allergens: allergens === null ? null : safeArray<string>(allergens),
    };
  }

  toFoodPage(dto: FoodPageDto | null | undefined): FoodPageModel {
    return {
      items: this.toModelList(pickField(dto, ['items'], [])),
      pageNumber: safeNumber(pickField(dto, ['pageNumber'], 1), 1),
      pageSize: safeNumber(pickField(dto, ['pageSize'], 20), 20),
      totalCount: safeNumber(pickField(dto, ['totalCount'], 0)),
      totalPages: safeNumber(pickField(dto, ['totalPages'], 0)),
      hasPreviousPage: safeBoolean(pickField(dto, ['hasPreviousPage'], false)),
      hasNextPage: safeBoolean(pickField(dto, ['hasNextPage'], false)),
    };
  }

  toCreateFoodDto(values: CreateFoodValues): CreateFoodDto {
    return {
      ...values,
      servingSize: Number(values.servingSize),
      calories: Number(values.calories),
      proteinGrams: Number(values.proteinGrams),
      carbsGrams: Number(values.carbsGrams),
      fatGrams: Number(values.fatGrams),
      fiberGrams: Number(values.fiberGrams),
      allergens: values.allergens.map((item) => item.trim()).filter(Boolean),
    };
  }

  toTarget(dto: TargetDto | null | undefined): TargetModel {
    return {
      id: safeString(pickField(dto, ['id'], '')),
      bmr: nullableNumber(pickField(dto, ['bmr'], null)),
      tdee: nullableNumber(pickField(dto, ['tdee'], null)),
      targetCalories: safeNumber(pickField(dto, ['targetCalories'], 0)),
      targetProteinGrams: safeNumber(pickField(dto, ['targetProteinGrams'], 0)),
      targetCarbsGrams: safeNumber(pickField(dto, ['targetCarbsGrams'], 0)),
      targetFatGrams: safeNumber(pickField(dto, ['targetFatGrams'], 0)),
      updatedAt: safeDate(pickField(dto, ['updatedAt'], null)),
    };
  }

  toSuggestedTargets(dto: SuggestedTargetsDto | null | undefined): SuggestedTargetsModel {
    return {
      targetCalories: safeNumber(pickField(dto, ['targetCalories'], 0)),
      targetProteinGrams: safeNumber(pickField(dto, ['targetProteinGrams'], 0)),
      targetCarbsGrams: safeNumber(pickField(dto, ['targetCarbsGrams'], 0)),
      targetFatGrams: safeNumber(pickField(dto, ['targetFatGrams'], 0)),
      rationale: safeString(pickField(dto, ['rationale'], '')),
      source: safeString(pickField(dto, ['source'], 'formula')) === 'ai' ? 'ai' : 'formula',
      safetyNote: safeString(pickField(dto, ['safetyNote'], '')),
    };
  }

  toTargetDto(values: TargetFormValues) {
    return {
      targetCalories: Number(values.targetCalories),
      targetProteinGrams: Number(values.targetProteinGrams),
      targetCarbsGrams: Number(values.targetCarbsGrams),
      targetFatGrams: Number(values.targetFatGrams),
    };
  }

  toSummary(dto: DailySummaryDto | null | undefined): DailySummaryModel {
    return {
      date: safeString(pickField(dto, ['date'], '')),
      targetCalories: safeNumber(pickField(dto, ['targetCalories'], 0)),
      consumedCalories: safeNumber(pickField(dto, ['consumedCalories'], 0)),
      remainingCalories: safeNumber(pickField(dto, ['remainingCalories'], 0)),
      macros: {
        protein: macro(pickField<MacroProgressDto | null>(dto, ['macros.protein'], null)),
        carbs: macro(pickField<MacroProgressDto | null>(dto, ['macros.carbs'], null)),
        fat: macro(pickField<MacroProgressDto | null>(dto, ['macros.fat'], null)),
      },
      meals: safeArray<MealSummaryDto, DailySummaryModel['meals'][number]>(
        pickField(dto, ['meals'], []),
        (item) => ({
          mealType: safeString(pickField(item, ['mealType'], '')),
          totalCalories: safeNumber(pickField(item, ['totalCalories'], 0)),
          itemsCount: safeNumber(pickField(item, ['itemsCount'], 0)),
        })
      ),
    };
  }

  toRecommendations(dto: RecommendationsDto | null | undefined): RecommendationsModel {
    return {
      remainingCalories: safeNumber(pickField(dto, ['remainingCalories'], 0)),
      recommendedMeals: safeArray<MealSuggestionDto, MealSuggestionModel>(
        pickField(dto, ['recommendedMeals'], []),
        (item) => suggestion(item)
      ),
      longevityTip: safeString(pickField(dto, ['longevityTip'], '')),
      tipCitations: safeArray<MealCitationDto, MealCitationModel>(
        pickField(dto, ['tipCitations'], []),
        (item) => citation(item)
      ),
      disclaimer: safeString(pickField(dto, ['disclaimer'], '')),
      calorieCapReached: safeBoolean(pickField(dto, ['calorieCapReached'], false)),
      safetyNote: safeString(pickField(dto, ['safetyNote'], '')),
    };
  }
}

function nullableNumber(value: number | null): number | null {
  return value === null ? null : safeNumber(value);
}
function macro(dto: MacroProgressDto | null): MacroProgressModel {
  return {
    consumed: safeNumber(pickField(dto, ['consumed'], 0)),
    target: safeNumber(pickField(dto, ['target'], 0)),
    remaining: safeNumber(pickField(dto, ['remaining'], 0)),
  };
}
function citation(dto: MealCitationDto): MealCitationModel {
  return {
    chapterNumber: safeNumber(pickField(dto, ['chapterNumber'], 0)),
    chapterTitle: safeString(pickField(dto, ['chapterTitle'], '')),
    bookPage: safeNumber(pickField(dto, ['bookPage'], 0)),
    pdfPage: safeNumber(pickField(dto, ['pdfPage'], 0)),
    quote: safeString(pickField(dto, ['quote'], '')),
    verified: safeBoolean(pickField(dto, ['verified'], false)),
    sourceFile: safeString(pickField(dto, ['sourceFile'], '')),
  };
}
function suggestion(dto: MealSuggestionDto): MealSuggestionModel {
  return {
    foodId: safeString(pickField(dto, ['foodId'], '')),
    name: safeString(pickField(dto, ['name'], '')),
    servingSize: safeNumber(pickField(dto, ['servingSize'], 0)),
    servingUnit: safeString(pickField(dto, ['servingUnit'], '')),
    calories: safeNumber(pickField(dto, ['calories'], 0)),
    proteinGrams: safeNumber(pickField(dto, ['proteinGrams'], 0)),
    carbsGrams: safeNumber(pickField(dto, ['carbsGrams'], 0)),
    fatGrams: safeNumber(pickField(dto, ['fatGrams'], 0)),
    description: safeString(pickField(dto, ['description'], '')),
    rationale: safeString(pickField(dto, ['rationale'], '')),
    citations: safeArray<MealCitationDto, MealCitationModel>(
      pickField(dto, ['citations'], []),
      (item) => citation(item)
    ),
  };
}

export const dietMapper = new DietMapper();
