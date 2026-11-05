/**
 * Progress DTO Types — Raw backend API contracts from Longevia Progress Service (.NET 10).
 * Source of truth:
 * - src/Services/Progress/Progress.Application/Features/
 * - specs/qbao-001-progress-service/frontend-guide.md
 */

// 1. Dashboard Summary
export interface DashboardSummaryResponseDto {
  currentWeightKg?: number | null;
  initialWeightKg?: number | null;
  weightDeltaKg?: number | null;
  currentBmi?: number | null;
  currentStreakDays?: number | null;
  bestStreakDays?: number | null;
  fastingThisWeekCompleted?: number | null;
  averageSleepHours?: number | null;
}

// 2. Fasting
export interface StartFastingRequestDto {
  protocol: string;
  startedAt: string; // ISO 8601 instant
  targetHours: number;
}

export interface EndFastingRequestDto {
  sessionId: string;
  endedAt: string; // ISO 8601 instant
}

export interface FastingSessionResponseDto {
  sessionId: string;
  protocol: string;
  startedAt: string;
  targetEndedAt: string;
  status: string;
}

export interface EndFastingResponseDto {
  sessionId: string;
  actualHours: number;
  targetHours: number;
  isGoalReached: boolean;
  status: string;
}

export interface CurrentFastingResponseDto {
  sessionId: string;
  protocol: string;
  startedAt: string;
  targetEndedAt: string;
  targetHours: number;
  elapsedHours: number;
  remainingHours: number;
  status: string;
}

// 3. Water
export interface LogWaterRequestDto {
  amountMl: number;
}

export interface WaterSummaryResponseDto {
  date: string; // DateOnly YYYY-MM-DD
  consumedMl: number;
  targetMl: number;
  percentComplete: number;
}

// 4. Sleep
export interface LogSleepRequestDto {
  sleptAt: string; // ISO 8601 instant
  wokeAt: string; // ISO 8601 instant
  sleepQuality: string; // "Poor" | "Fair" | "Good" | "Excellent"
}

export interface SleepResponseDto {
  id: string;
  sleptAt: string;
  wokeAt: string;
  sleepQuality: string;
  durationHours: number;
  date: string; // DateOnly YYYY-MM-DD
}

// 5. Body Metrics
export interface LogBodyMetricRequestDto {
  loggedAt: string; // ISO 8601 instant
  weightKg: number;
  bodyFatPercent?: number | null;
  waistCircumferenceCm?: number | null;
  systolicBloodPressure?: number | null;
  diastolicBloodPressure?: number | null;
  restingHeartRate?: number | null;
}

export interface BodyMetricResponseDto {
  id: string;
  loggedAt: string;
  weightKg: number;
  bmi: number;
  bmiCategory: string; // "Underweight" | "NormalWeight" | "Overweight" | "Obese"
  bodyFatPercent?: number | null;
  waistCircumferenceCm?: number | null;
  systolicBloodPressure?: number | null;
  diastolicBloodPressure?: number | null;
  restingHeartRate?: number | null;
}

export interface MetricsHistoryResponseDto {
  items: BodyMetricResponseDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GetMetricsHistoryParamsDto {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  pageNumber?: number;
  pageSize?: number;
}
