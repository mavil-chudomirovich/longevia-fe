export interface WorkoutCitationModel {
  chapterNumber: number;
  chapterTitle: string;
  bookPage: number;
  pdfPage: number;
  quote: string;
  verified: boolean;
  sourceFile: string;
}

export interface WorkoutPlanDayModel {
  date: string;
  restDay: boolean;
  activity: string;
  durationMinutes: number;
  intensity: string;
  equipmentUsed: string[];
  rationale: string;
  citations: WorkoutCitationModel[];
}

export interface WorkoutWarningModel {
  code: string;
  message: string;
  scope: string;
}

export interface WorkoutPlanModel {
  id: string;
  weekStartDate: string;
  daysRequested: number;
  sessionsScheduled: number;
  minutesPerSession: number;
  usedFallback: boolean;
  disclaimer: string;
  warnings: WorkoutWarningModel[];
  days: WorkoutPlanDayModel[];
  generatedAt: Date | null;
}

export interface LongevityComponentModel {
  key: string;
  score: number;
  weight: number;
  reason: string;
}

export interface LongevityCitationModel {
  chapterNumber: number;
  chapterTitle: string;
  bookPage: number;
  pdfPage: number;
  quote: string;
  verified: boolean;
  sourceFile: string;
}

export interface LongevityHabitsModel {
  longevityScore: number;
  actionableInsights: string[];
  scoreBreakdown: LongevityComponentModel[];
  citations: LongevityCitationModel[];
  disclaimer: string;
}
