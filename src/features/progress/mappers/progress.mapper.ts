import { BaseMapper, pickField, safeNumber, safeString, safeArray } from '@/lib/mapper';
import {
  BodyMetricResponseDto,
  CurrentFastingResponseDto,
  DashboardSummaryResponseDto,
  EndFastingResponseDto,
  FastingSessionResponseDto,
  MetricsHistoryResponseDto,
  SleepResponseDto,
  WaterSummaryResponseDto,
} from '../types/progress.dto';
import {
  BmiCategoryEnum,
  BodyMetricRecord,
  CurrentFastingSession,
  DashboardSummary,
  EndFastingResult,
  FastingSessionResult,
  FastingStatusEnum,
  MetricsHistory,
  SleepQualityEnum,
  SleepRecord,
  WaterSummary,
} from '../types/progress.model';
import {
  formatDisplayDateTime,
  formatDurationHours,
  getUtcTodayDateString,
} from '../utils/progress-date';

export const BMI_CATEGORY_LABELS: Record<BmiCategoryEnum, string> = {
  [BmiCategoryEnum.UNDERWEIGHT]: 'Thiếu cân',
  [BmiCategoryEnum.NORMAL_WEIGHT]: 'Bình thường',
  [BmiCategoryEnum.OVERWEIGHT]: 'Thừa cân',
  [BmiCategoryEnum.OBESE]: 'Béo phì',
};

export const SLEEP_QUALITY_LABELS: Record<SleepQualityEnum, string> = {
  [SleepQualityEnum.POOR]: 'Kém',
  [SleepQualityEnum.FAIR]: 'Trung bình',
  [SleepQualityEnum.GOOD]: 'Tốt',
  [SleepQualityEnum.EXCELLENT]: 'Rất tốt',
};

export function getBmiCategoryFromBmi(bmi: number): BmiCategoryEnum {
  if (bmi < 18.5) return BmiCategoryEnum.UNDERWEIGHT;
  if (bmi < 25.0) return BmiCategoryEnum.NORMAL_WEIGHT;
  if (bmi < 30.0) return BmiCategoryEnum.OVERWEIGHT;
  return BmiCategoryEnum.OBESE;
}

export class ProgressMapper extends BaseMapper<BodyMetricResponseDto, BodyMetricRecord> {
  /**
   * Chuyển đổi DTO một bản ghi chỉ số cơ thể sang Model sạch
   */
  toModel(dto: BodyMetricResponseDto | null | undefined): BodyMetricRecord {
    return this.toBodyMetricRecord(dto);
  }

  /**
   * Chuyển đổi Dashboard Summary DTO sang UI Model
   * Lưu ý bảo toàn giá trị null đối với cân nặng và BMI chưa có dữ liệu (không ép về 0).
   */
  toDashboardSummary(dto?: DashboardSummaryResponseDto | null): DashboardSummary {
    const rawWeight = pickField<number | null>(dto, ['currentWeightKg', 'current_weight_kg'], null);
    const rawInitialWeight = pickField<number | null>(
      dto,
      ['initialWeightKg', 'initial_weight_kg'],
      null
    );
    const rawDelta = pickField<number | null>(dto, ['weightDeltaKg', 'weight_delta_kg'], null);
    const rawBmi = pickField<number | null>(dto, ['currentBmi', 'current_bmi'], null);
    const rawSleep = pickField<number | null>(
      dto,
      ['averageSleepHours', 'average_sleep_hours'],
      null
    );

    const currentWeightKg =
      rawWeight !== null && rawWeight !== undefined ? Number(rawWeight) : null;
    const initialWeightKg =
      rawInitialWeight !== null && rawInitialWeight !== undefined ? Number(rawInitialWeight) : null;
    const weightDeltaKg = rawDelta !== null && rawDelta !== undefined ? Number(rawDelta) : null;
    const currentBmi = rawBmi !== null && rawBmi !== undefined ? Number(rawBmi) : null;
    const averageSleepHours = rawSleep !== null && rawSleep !== undefined ? Number(rawSleep) : null;

    let bmiCategory: BmiCategoryEnum | null = null;
    let bmiCategoryLabel: string | null = null;

    if (currentBmi !== null && !isNaN(currentBmi)) {
      bmiCategory = getBmiCategoryFromBmi(currentBmi);
      bmiCategoryLabel = BMI_CATEGORY_LABELS[bmiCategory];
    }

    return {
      currentWeightKg,
      initialWeightKg,
      weightDeltaKg,
      currentBmi,
      bmiCategory,
      bmiCategoryLabel,
      currentStreakDays: safeNumber(
        pickField(dto, ['currentStreakDays', 'current_streak_days'], 0),
        0
      ),
      bestStreakDays: safeNumber(pickField(dto, ['bestStreakDays', 'best_streak_days'], 0), 0),
      fastingThisWeekCompleted: safeNumber(
        pickField(dto, ['fastingThisWeekCompleted', 'fasting_this_week_completed'], 0),
        0
      ),
      averageSleepHours,
      hasRecordedMetrics: currentWeightKg !== null,
    };
  }

  /**
   * Chuyển đổi phiên nhịn ăn hiện tại (trả về null nếu không có phiên active)
   */
  toCurrentFastingSession(dto?: CurrentFastingResponseDto | null): CurrentFastingSession | null {
    if (!dto || !dto.sessionId) {
      return null;
    }

    const targetHours = safeNumber(dto.targetHours, 16);
    const elapsedHours = Math.max(0, safeNumber(dto.elapsedHours, 0));
    const remainingHours = Math.max(0, safeNumber(dto.remainingHours, 0));

    const progressPercent = targetHours > 0 ? Math.round((elapsedHours / targetHours) * 100) : 0;
    const visualPercent = Math.min(100, Math.max(0, progressPercent));

    return {
      sessionId: safeString(dto.sessionId),
      protocol: safeString(dto.protocol, '16:8'),
      startedAt: new Date(dto.startedAt),
      targetEndedAt: new Date(dto.targetEndedAt),
      targetHours,
      elapsedHours,
      remainingHours,
      progressPercent,
      visualPercent,
      isGoalReached: elapsedHours >= targetHours,
      status: FastingStatusEnum.IN_PROGRESS,
      statusLabel: 'Đang nhịn ăn',
    };
  }

  toFastingSessionResult(dto: FastingSessionResponseDto): FastingSessionResult {
    return {
      sessionId: safeString(dto.sessionId),
      protocol: safeString(dto.protocol),
      startedAt: new Date(dto.startedAt),
      targetEndedAt: new Date(dto.targetEndedAt),
      status: safeString(dto.status, 'InProgress'),
    };
  }

  toEndFastingResult(dto: EndFastingResponseDto): EndFastingResult {
    const actualHours = safeNumber(dto.actualHours, 0);
    return {
      sessionId: safeString(dto.sessionId),
      actualHours,
      targetHours: safeNumber(dto.targetHours, 0),
      isGoalReached: Boolean(dto.isGoalReached),
      status: safeString(dto.status, 'Completed'),
      formattedActualHours: formatDurationHours(actualHours),
    };
  }

  /**
   * Chuyển đổi dữ liệu tổng hợp nước uống hôm nay
   */
  toWaterSummary(dto?: WaterSummaryResponseDto | null): WaterSummary {
    const consumedMl = safeNumber(pickField(dto, ['consumedMl', 'consumed_ml'], 0), 0);
    const targetMl = safeNumber(pickField(dto, ['targetMl', 'target_ml'], 2500), 2500);

    const rawPercent = pickField<number | null>(dto, ['percentComplete', 'percent_complete'], null);
    const percentComplete =
      rawPercent !== null && rawPercent !== undefined
        ? Math.round(Number(rawPercent) * 10) / 10
        : targetMl > 0
          ? Math.round((consumedMl / targetMl) * 1000) / 10
          : 0;

    const visualPercent = Math.min(100, Math.max(0, percentComplete));
    const remainingMl = Math.max(0, targetMl - consumedMl);

    return {
      date: safeString(pickField(dto, ['date'], getUtcTodayDateString())),
      consumedMl,
      targetMl,
      percentComplete,
      visualPercent,
      remainingMl,
    };
  }

  /**
   * Chuyển đổi bản ghi giấc ngủ
   */
  toSleepRecord(dto: SleepResponseDto): SleepRecord {
    const rawQuality = safeString(dto.sleepQuality, 'Good') as SleepQualityEnum;
    const sleepQuality = Object.values(SleepQualityEnum).includes(rawQuality)
      ? rawQuality
      : SleepQualityEnum.GOOD;

    const durationHours = safeNumber(dto.durationHours, 0);

    return {
      id: safeString(dto.id),
      sleptAt: new Date(dto.sleptAt),
      wokeAt: new Date(dto.wokeAt),
      sleepQuality,
      sleepQualityLabel: SLEEP_QUALITY_LABELS[sleepQuality] ?? 'Tốt',
      durationHours,
      formattedDuration: formatDurationHours(durationHours),
      date: safeString(dto.date),
    };
  }

  /**
   * Chuyển đổi chỉ số cơ thể sang Model sạch
   */
  toBodyMetricRecord(dto: BodyMetricResponseDto | null | undefined): BodyMetricRecord {
    const rawBmi = safeNumber(pickField(dto, ['bmi'], 0), 0);
    const rawCategoryStr = safeString(pickField(dto, ['bmiCategory', 'bmi_category'], ''));

    let bmiCategory: BmiCategoryEnum;
    if (Object.values(BmiCategoryEnum).includes(rawCategoryStr as BmiCategoryEnum)) {
      bmiCategory = rawCategoryStr as BmiCategoryEnum;
    } else {
      bmiCategory = getBmiCategoryFromBmi(rawBmi);
    }

    const rawFat = pickField<number | null>(dto, ['bodyFatPercent', 'body_fat_percent'], null);
    const rawWaist = pickField<number | null>(
      dto,
      ['waistCircumferenceCm', 'waist_circumference_cm'],
      null
    );
    const rawSys = pickField<number | null>(
      dto,
      ['systolicBloodPressure', 'systolic_blood_pressure'],
      null
    );
    const rawDia = pickField<number | null>(
      dto,
      ['diastolicBloodPressure', 'diastolic_blood_pressure'],
      null
    );
    const rawHr = pickField<number | null>(dto, ['restingHeartRate', 'resting_heart_rate'], null);

    const systolic = rawSys !== null && rawSys !== undefined ? Number(rawSys) : null;
    const diastolic = rawDia !== null && rawDia !== undefined ? Number(rawDia) : null;

    let bloodPressureDisplay: string | null = null;
    if (systolic !== null && diastolic !== null) {
      bloodPressureDisplay = `${systolic}/${diastolic} mmHg`;
    }

    const rawLoggedAt = pickField(dto, ['loggedAt', 'logged_at'], new Date().toISOString());

    return {
      id: safeString(pickField(dto, ['id'], '')),
      loggedAt: new Date(rawLoggedAt),
      formattedLoggedAt: formatDisplayDateTime(rawLoggedAt),
      weightKg: safeNumber(pickField(dto, ['weightKg', 'weight_kg'], 0), 0),
      bmi: rawBmi,
      bmiCategory,
      bmiCategoryLabel: BMI_CATEGORY_LABELS[bmiCategory],
      bodyFatPercent: rawFat !== null && rawFat !== undefined ? Number(rawFat) : null,
      waistCircumferenceCm: rawWaist !== null && rawWaist !== undefined ? Number(rawWaist) : null,
      systolicBloodPressure: systolic,
      diastolicBloodPressure: diastolic,
      bloodPressureDisplay,
      restingHeartRate: rawHr !== null && rawHr !== undefined ? Number(rawHr) : null,
    };
  }

  /**
   * Chuyển đổi lịch sử chỉ số phân trang
   */
  toMetricsHistory(dto?: MetricsHistoryResponseDto | null): MetricsHistory {
    const rawItems = safeArray<BodyMetricResponseDto>(pickField(dto, ['items'], []));
    const pageNumber = Math.max(1, safeNumber(pickField(dto, ['pageNumber', 'page_number'], 1), 1));
    const pageSize = Math.max(1, safeNumber(pickField(dto, ['pageSize', 'page_size'], 20), 20));
    const totalCount = Math.max(0, safeNumber(pickField(dto, ['totalCount', 'total_count'], 0), 0));
    const totalPages = Math.max(0, safeNumber(pickField(dto, ['totalPages', 'total_pages'], 0), 0));

    return {
      items: rawItems.map((item) => this.toBodyMetricRecord(item)),
      pageNumber,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    };
  }
}

export const progressMapper = new ProgressMapper();
