import { pickField, safeArray, safeBoolean, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type {
  GenerateWorkoutPlanDto,
  LongevityCitationDto,
  LongevityComponentDto,
  LongevityHabitsDto,
  WorkoutCitationDto,
  WorkoutPlanDayDto,
  WorkoutPlanDto,
  WorkoutWarningDto,
} from '../types/progress-ai.dto';
import type {
  LongevityCitationModel,
  LongevityComponentModel,
  LongevityHabitsModel,
  WorkoutCitationModel,
  WorkoutPlanDayModel,
  WorkoutPlanModel,
  WorkoutWarningModel,
} from '../types/progress-ai.model';

const workoutCitation = (dto: WorkoutCitationDto): WorkoutCitationModel => ({
  chapterNumber: safeNumber(pickField(dto, ['chapterNumber'], 0)),
  chapterTitle: safeString(pickField(dto, ['chapterTitle'], '')),
  bookPage: safeNumber(pickField(dto, ['bookPage'], 0)),
  pdfPage: safeNumber(pickField(dto, ['pdfPage'], 0)),
  quote: safeString(pickField(dto, ['quote'], '')),
  verified: safeBoolean(pickField(dto, ['verified'], false)),
  sourceFile: safeString(pickField(dto, ['sourceFile'], '')),
});

const workoutDay = (dto: WorkoutPlanDayDto): WorkoutPlanDayModel => ({
  date: safeString(pickField(dto, ['date'], '')),
  restDay: safeBoolean(pickField(dto, ['restDay'], false)),
  activity: safeString(pickField(dto, ['activity'], '')),
  activityLabel: safeString(pickField(dto, ['activityLabel'], '')),
  durationMinutes: safeNumber(pickField(dto, ['durationMinutes'], 0)),
  intensity: safeString(pickField(dto, ['intensity'], '')),
  equipmentUsed: safeArray<string>(dto.equipmentUsed ?? []),
  rationale: safeString(pickField(dto, ['rationale'], '')),
  citations: safeArray<WorkoutCitationDto>(dto.citations ?? []).map(workoutCitation),
});

const workoutWarning = (dto: WorkoutWarningDto): WorkoutWarningModel => ({
  code: safeString(pickField(dto, ['code'], '')),
  message: safeString(pickField(dto, ['message'], '')),
  scope: safeString(pickField(dto, ['scope'], '')),
});

const longevityCitation = (dto: LongevityCitationDto): LongevityCitationModel => ({
  chapterNumber: safeNumber(pickField(dto, ['chapterNumber'], 0)),
  chapterTitle: safeString(pickField(dto, ['chapterTitle'], '')),
  bookPage: safeNumber(pickField(dto, ['bookPage'], 0)),
  pdfPage: safeNumber(pickField(dto, ['pdfPage'], 0)),
  quote: safeString(pickField(dto, ['quote'], '')),
  verified: safeBoolean(pickField(dto, ['verified'], false)),
  sourceFile: safeString(pickField(dto, ['sourceFile'], '')),
});

const longevityComponent = (dto: LongevityComponentDto): LongevityComponentModel => ({
  key: safeString(pickField(dto, ['key'], '')),
  score: safeNumber(pickField(dto, ['score'], 0)),
  weight: safeNumber(pickField(dto, ['weight'], 0)),
  reason: safeString(pickField(dto, ['reason'], '')),
});

export const progressAiMapper = {
  toWorkoutPlan(dto: WorkoutPlanDto | null | undefined): WorkoutPlanModel {
    return {
      id: safeString(pickField(dto, ['id'], '')),
      weekStartDate: safeString(pickField(dto, ['weekStartDate'], '')),
      daysRequested: safeNumber(pickField(dto, ['daysRequested'], 0)),
      sessionsScheduled: safeNumber(pickField(dto, ['sessionsScheduled'], 0)),
      minutesPerSession: safeNumber(pickField(dto, ['minutesPerSession'], 0)),
      usedFallback: safeBoolean(pickField(dto, ['usedFallback'], false)),
      usedFallbackReason: safeString(pickField(dto, ['usedFallbackReason'], '')) || null,
      disclaimer: safeString(pickField(dto, ['disclaimer'], '')),
      warnings: safeArray<WorkoutWarningDto>(dto?.warnings ?? []).map(workoutWarning),
      days: safeArray<WorkoutPlanDayDto>(dto?.days ?? []).map(workoutDay),
      generatedAt: safeDate(pickField(dto, ['generatedAt'], null)),
    };
  },
  toWorkoutRequest(
    weekStartDate: string,
    goal: string,
    days: number,
    sessionsPerWeek: number,
    minutesPerSession: number
  ): GenerateWorkoutPlanDto {
    return { weekStartDate, goal, days, sessionsPerWeek, minutesPerSession };
  },
  toLongevity(dto: LongevityHabitsDto | null | undefined): LongevityHabitsModel {
    return {
      longevityScore: safeNumber(pickField(dto, ['longevityScore'], 0)),
      actionableInsights: safeArray<string>(dto?.actionableInsights ?? []),
      scoreBreakdown: safeArray<LongevityComponentDto>(dto?.scoreBreakdown ?? []).map(
        longevityComponent
      ),
      citations: safeArray<LongevityCitationDto>(dto?.citations ?? []).map(longevityCitation),
      disclaimer: safeString(pickField(dto, ['disclaimer'], '')),
    };
  },
};
