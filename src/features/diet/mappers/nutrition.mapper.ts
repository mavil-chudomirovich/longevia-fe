import { pickField, safeArray, safeBoolean, safeNumber, safeString } from '@/lib/mapper';
import type {
  NutrientGapCitationDto,
  NutrientGapDto,
  NutrientGapItemDto,
} from '../types/nutrition.dto';
import type {
  NutrientCitationModel,
  NutrientGapItemModel,
  NutrientGapModel,
} from '../types/nutrition.model';

const gap = (dto: NutrientGapItemDto): NutrientGapItemModel => ({
  nutrient: safeString(pickField(dto, ['nutrient'], '')),
  unit: safeString(pickField(dto, ['unit'], '')),
  target: safeNumber(pickField(dto, ['target'], 0)),
  averageIntake: safeNumber(pickField(dto, ['averageIntake'], 0)),
  deficit: safeNumber(pickField(dto, ['deficit'], 0)),
  severity: safeString(pickField(dto, ['severity'], '')),
});

const citation = (dto: NutrientGapCitationDto): NutrientCitationModel => ({
  chapterNumber: safeNumber(pickField(dto, ['chapterNumber'], 0)),
  chapterTitle: safeString(pickField(dto, ['chapterTitle'], '')),
  bookPage: safeNumber(pickField(dto, ['bookPage'], 0)),
  pdfPage: safeNumber(pickField(dto, ['pdfPage'], 0)),
  quote: safeString(pickField(dto, ['quote'], '')),
  verified: safeBoolean(pickField(dto, ['verified'], false)),
  sourceFile: safeString(pickField(dto, ['sourceFile'], '')),
});

export const nutritionMapper = {
  toModel(dto: NutrientGapDto | null | undefined): NutrientGapModel {
    return {
      gaps: safeArray<NutrientGapItemDto>(dto?.gaps ?? []).map(gap),
      deficientNutrients: safeArray<string>(dto?.deficientNutrients ?? []),
      suggestedFoods: safeArray<string>(dto?.suggestedFoods ?? []),
      analysisSummary: safeString(pickField(dto, ['analysisSummary'], '')),
      citations: safeArray<NutrientGapCitationDto>(dto?.citations ?? []).map(citation),
      disclaimer: safeString(pickField(dto, ['disclaimer'], '')),
      dataWarnings: safeArray<string>(dto?.dataWarnings ?? []),
      daysWithData: safeNumber(pickField(dto, ['daysWithData'], 0)),
    };
  },
};
