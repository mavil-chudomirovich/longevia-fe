export interface WorkoutCitationDto {
  chapterNumber?: number;
  chapterTitle?: string;
  bookPage?: number;
  pdfPage?: number;
  quote?: string;
  verified?: boolean;
  sourceFile?: string;
}

export interface WorkoutPlanDayDto {
  date?: string;
  restDay?: boolean;
  activity?: string;
  activityLabel?: string;
  durationMinutes?: number;
  intensity?: string;
  equipmentUsed?: string[] | null;
  rationale?: string;
  citations?: WorkoutCitationDto[] | null;
  activities?: WorkoutActivityDto[] | null;
}

export interface WorkoutActivityDto {
  activity?: string;
  activityLabel?: string;
  durationMinutes?: number;
  intensity?: string;
  equipmentUsed?: string[] | null;
}

export interface WorkoutWarningDto {
  code?: string;
  message?: string;
  scope?: string;
}

export interface WorkoutPlanDto {
  id?: string;
  weekStartDate?: string;
  daysRequested?: number;
  sessionsScheduled?: number;
  minutesPerSession?: number;
  usedFallback?: boolean;
  usedFallbackReason?: string;
  disclaimer?: string;
  warnings?: WorkoutWarningDto[] | null;
  days?: WorkoutPlanDayDto[] | null;
  generatedAt?: string;
  activityPreference?: string[] | null;
  equipmentAvailable?: string[] | null;
  limitations?: string[] | null;
}

export interface GenerateWorkoutPlanDto {
  weekStartDate: string;
  goal: string;
  days: number;
  sessionsPerWeek: number;
  minutesPerSession: number;
  activityPreference?: string[];
  equipmentAvailable?: string[];
  limitations?: string[];
}

export interface LongevityComponentDto {
  key?: string;
  score?: number;
  weight?: number;
  reason?: string;
}

export interface LongevityCitationDto {
  chapterNumber?: number;
  chapterTitle?: string;
  bookPage?: number;
  pdfPage?: number;
  quote?: string;
  verified?: boolean;
  sourceFile?: string;
}

export interface LongevityHabitsDto {
  longevityScore?: number;
  actionableInsights?: string[] | null;
  scoreBreakdown?: LongevityComponentDto[] | null;
  citations?: LongevityCitationDto[] | null;
  disclaimer?: string;
}
