/**
 * Progress UI Models — Clean, strictly typed domain models consumed by UI components.
 * UI components only interact with these models, never with raw DTOs.
 */

export enum FastingProtocolEnum {
  P16_8 = '16:8',
  P18_6 = '18:6',
  P20_4 = '20:4',
  CUSTOM = 'Custom',
}

export enum FastingStatusEnum {
  IN_PROGRESS = 'InProgress',
  COMPLETED = 'Completed',
}

export enum SleepQualityEnum {
  POOR = 'Poor',
  FAIR = 'Fair',
  GOOD = 'Good',
  EXCELLENT = 'Excellent',
}

export enum BmiCategoryEnum {
  UNDERWEIGHT = 'Underweight',
  NORMAL_WEIGHT = 'NormalWeight',
  OVERWEIGHT = 'Overweight',
  OBESE = 'Obese',
}

export interface DashboardSummary {
  currentWeightKg: number | null;
  initialWeightKg: number | null;
  weightDeltaKg: number | null; // So với mốc 7 ngày trước, null nếu thiếu baseline
  currentBmi: number | null;
  bmiCategory: BmiCategoryEnum | null;
  bmiCategoryLabel: string | null;
  currentStreakDays: number;
  bestStreakDays: number;
  fastingThisWeekCompleted: number;
  averageSleepHours: number | null;
  hasRecordedMetrics: boolean;
}

export interface CurrentFastingSession {
  sessionId: string;
  protocol: string;
  startedAt: Date;
  targetEndedAt: Date;
  targetHours: number;
  elapsedHours: number;
  remainingHours: number;
  progressPercent: number; // Tỷ lệ hoàn thành thực tế (có thể >100% nếu vượt mục tiêu)
  visualPercent: number; // Tỷ lệ kẹp [0..100] phục vụ thanh progress bar
  isGoalReached: boolean;
  status: FastingStatusEnum;
  statusLabel: string;
}

export interface FastingSessionResult {
  sessionId: string;
  protocol: string;
  startedAt: Date;
  targetEndedAt: Date;
  status: string;
}

export interface EndFastingResult {
  sessionId: string;
  actualHours: number;
  targetHours: number;
  isGoalReached: boolean;
  status: string;
  formattedActualHours: string;
}

export interface WaterSummary {
  date: string; // DateOnly YYYY-MM-DD
  consumedMl: number;
  targetMl: number; // Mặc định cố định MVP 2500ml
  percentComplete: number; // % thực tế (vd: 120%)
  visualPercent: number; // % kẹp [0..100] cho thanh tiến trình
  remainingMl: number; // Số ml còn thiếu để đạt mục tiêu (tối thiểu 0)
}

export interface SleepRecord {
  id: string;
  sleptAt: Date;
  wokeAt: Date;
  sleepQuality: SleepQualityEnum;
  sleepQualityLabel: string;
  durationHours: number;
  formattedDuration: string;
  date: string;
}

export interface BodyMetricRecord {
  id: string;
  loggedAt: Date;
  formattedLoggedAt: string;
  weightKg: number;
  bmi: number;
  bmiCategory: BmiCategoryEnum;
  bmiCategoryLabel: string;
  bodyFatPercent: number | null;
  waistCircumferenceCm: number | null;
  systolicBloodPressure: number | null;
  diastolicBloodPressure: number | null;
  bloodPressureDisplay: string | null;
  restingHeartRate: number | null;
}

export interface MetricsHistory {
  items: BodyMetricRecord[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface GetMetricsHistoryFilters {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  pageNumber?: number;
  pageSize?: number;
}
