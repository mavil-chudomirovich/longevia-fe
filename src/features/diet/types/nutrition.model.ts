export interface NutrientGapItemModel {
  nutrient: string;
  unit: string;
  target: number;
  averageIntake: number;
  deficit: number;
  severity: string;
}

export interface NutrientCitationModel {
  chapterNumber: number;
  chapterTitle: string;
  bookPage: number;
  pdfPage: number;
  quote: string;
  verified: boolean;
  sourceFile: string;
}

export interface NutrientGapModel {
  gaps: NutrientGapItemModel[];
  deficientNutrients: string[];
  suggestedFoods: string[];
  analysisSummary: string;
  citations: NutrientCitationModel[];
  disclaimer: string;
  dataWarnings: string[];
  daysWithData: number;
}
