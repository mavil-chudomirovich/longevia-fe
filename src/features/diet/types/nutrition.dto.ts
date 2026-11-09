export interface NutrientGapItemDto {
  nutrient?: string;
  unit?: string;
  target?: number;
  averageIntake?: number;
  deficit?: number;
  severity?: string;
}

export interface NutrientGapCitationDto {
  chapterNumber?: number;
  chapterTitle?: string;
  bookPage?: number;
  pdfPage?: number;
  quote?: string;
  verified?: boolean;
  sourceFile?: string;
}

export interface NutrientGapDto {
  gaps?: NutrientGapItemDto[] | null;
  deficientNutrients?: string[] | null;
  suggestedFoods?: string[] | null;
  analysisSummary?: string;
  citations?: NutrientGapCitationDto[] | null;
  disclaimer?: string;
  dataWarnings?: string[] | null;
  daysWithData?: number;
}
