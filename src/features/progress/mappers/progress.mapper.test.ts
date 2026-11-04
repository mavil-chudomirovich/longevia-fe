import { describe, it, expect } from 'vitest';
import { progressMapper, getBmiCategoryFromBmi, BMI_CATEGORY_LABELS } from './progress.mapper';
import { BmiCategoryEnum, FastingStatusEnum, SleepQualityEnum } from '../types/progress.model';
import {
  DashboardSummaryResponseDto,
  CurrentFastingResponseDto,
  WaterSummaryResponseDto,
  SleepResponseDto,
  BodyMetricResponseDto,
  MetricsHistoryResponseDto,
} from '../types/progress.dto';

describe('ProgressMapper Unit Tests', () => {
  describe('toDashboardSummary', () => {
    it('maps complete dashboard summary DTO correctly', () => {
      const dto: DashboardSummaryResponseDto = {
        currentWeightKg: 68.5,
        initialWeightKg: 72.0,
        weightDeltaKg: -1.5,
        currentBmi: 22.37,
        currentStreakDays: 2,
        bestStreakDays: 5,
        fastingThisWeekCompleted: 1,
        averageSleepHours: 8.0,
      };

      const result = progressMapper.toDashboardSummary(dto);

      expect(result.currentWeightKg).toBe(68.5);
      expect(result.initialWeightKg).toBe(72.0);
      expect(result.weightDeltaKg).toBe(-1.5);
      expect(result.currentBmi).toBe(22.37);
      expect(result.bmiCategory).toBe(BmiCategoryEnum.NORMAL_WEIGHT);
      expect(result.bmiCategoryLabel).toBe('Bình thường');
      expect(result.currentStreakDays).toBe(2);
      expect(result.bestStreakDays).toBe(5);
      expect(result.fastingThisWeekCompleted).toBe(1);
      expect(result.averageSleepHours).toBe(8.0);
      expect(result.hasRecordedMetrics).toBe(true);
    });

    it('preserves null values for empty dashboard fields without coercing to zero', () => {
      const dto: DashboardSummaryResponseDto = {
        currentWeightKg: null,
        initialWeightKg: null,
        weightDeltaKg: null,
        currentBmi: null,
        currentStreakDays: 0,
        bestStreakDays: 0,
        fastingThisWeekCompleted: 0,
        averageSleepHours: null,
      };

      const result = progressMapper.toDashboardSummary(dto);

      expect(result.currentWeightKg).toBeNull();
      expect(result.initialWeightKg).toBeNull();
      expect(result.weightDeltaKg).toBeNull();
      expect(result.currentBmi).toBeNull();
      expect(result.bmiCategory).toBeNull();
      expect(result.bmiCategoryLabel).toBeNull();
      expect(result.averageSleepHours).toBeNull();
      expect(result.hasRecordedMetrics).toBe(false);
      expect(result.currentStreakDays).toBe(0);
    });

    it('handles undefined dto safely', () => {
      const result = progressMapper.toDashboardSummary(undefined);
      expect(result.currentWeightKg).toBeNull();
      expect(result.currentStreakDays).toBe(0);
      expect(result.hasRecordedMetrics).toBe(false);
    });
  });

  describe('BMI Category Resolution', () => {
    it('categorizes underweight for BMI < 18.5', () => {
      expect(getBmiCategoryFromBmi(17.5)).toBe(BmiCategoryEnum.UNDERWEIGHT);
      expect(BMI_CATEGORY_LABELS[BmiCategoryEnum.UNDERWEIGHT]).toBe('Thiếu cân');
    });

    it('categorizes normal weight for 18.5 <= BMI < 25.0', () => {
      expect(getBmiCategoryFromBmi(22.0)).toBe(BmiCategoryEnum.NORMAL_WEIGHT);
      expect(BMI_CATEGORY_LABELS[BmiCategoryEnum.NORMAL_WEIGHT]).toBe('Bình thường');
    });

    it('categorizes overweight for 25.0 <= BMI < 30.0', () => {
      expect(getBmiCategoryFromBmi(27.4)).toBe(BmiCategoryEnum.OVERWEIGHT);
      expect(BMI_CATEGORY_LABELS[BmiCategoryEnum.OVERWEIGHT]).toBe('Thừa cân');
    });

    it('categorizes obese for BMI >= 30.0', () => {
      expect(getBmiCategoryFromBmi(32.1)).toBe(BmiCategoryEnum.OBESE);
      expect(BMI_CATEGORY_LABELS[BmiCategoryEnum.OBESE]).toBe('Béo phì');
    });
  });

  describe('toCurrentFastingSession', () => {
    it('maps active fasting session with accurate progress percentages', () => {
      const dto: CurrentFastingResponseDto = {
        sessionId: 'b6a7b738-f58c-4a34-bcf2-76332bf143a5',
        protocol: '16:8',
        startedAt: '2026-10-25T08:00:00Z',
        targetEndedAt: '2026-10-26T00:00:00Z',
        targetHours: 16,
        elapsedHours: 12.0,
        remainingHours: 4.0,
        status: 'InProgress',
      };

      const result = progressMapper.toCurrentFastingSession(dto);

      expect(result).not.toBeNull();
      expect(result?.sessionId).toBe('b6a7b738-f58c-4a34-bcf2-76332bf143a5');
      expect(result?.protocol).toBe('16:8');
      expect(result?.targetHours).toBe(16);
      expect(result?.elapsedHours).toBe(12.0);
      expect(result?.remainingHours).toBe(4.0);
      expect(result?.progressPercent).toBe(75);
      expect(result?.visualPercent).toBe(75);
      expect(result?.isGoalReached).toBe(false);
      expect(result?.status).toBe(FastingStatusEnum.IN_PROGRESS);
      expect(result?.statusLabel).toBe('Đang nhịn ăn');
    });

    it('clamps visualPercent to 100 while preserving progressPercent > 100 on overtime fasting', () => {
      const dto: CurrentFastingResponseDto = {
        sessionId: 'b6a7b738-f58c-4a34-bcf2-76332bf143a5',
        protocol: '16:8',
        startedAt: '2026-10-25T08:00:00Z',
        targetEndedAt: '2026-10-26T00:00:00Z',
        targetHours: 16,
        elapsedHours: 18.0,
        remainingHours: 0.0,
        status: 'InProgress',
      };

      const result = progressMapper.toCurrentFastingSession(dto);

      expect(result?.progressPercent).toBe(113);
      expect(result?.visualPercent).toBe(100);
      expect(result?.isGoalReached).toBe(true);
    });

    it('returns null when dto is null or missing sessionId', () => {
      expect(progressMapper.toCurrentFastingSession(null)).toBeNull();
      expect(progressMapper.toCurrentFastingSession(undefined)).toBeNull();
      expect(progressMapper.toCurrentFastingSession({} as CurrentFastingResponseDto)).toBeNull();
    });
  });

  describe('toWaterSummary', () => {
    it('maps water summary with 2500ml target and calculates completion percentage', () => {
      const dto: WaterSummaryResponseDto = {
        date: '2026-10-25',
        consumedMl: 1000,
        targetMl: 2500,
        percentComplete: 40.0,
      };

      const result = progressMapper.toWaterSummary(dto);

      expect(result.date).toBe('2026-10-25');
      expect(result.consumedMl).toBe(1000);
      expect(result.targetMl).toBe(2500);
      expect(result.percentComplete).toBe(40.0);
      expect(result.visualPercent).toBe(40.0);
      expect(result.remainingMl).toBe(1500);
    });

    it('clamps visualPercent to 100 and remaining to 0 when water goal is exceeded', () => {
      const dto: WaterSummaryResponseDto = {
        date: '2026-10-25',
        consumedMl: 3000,
        targetMl: 2500,
        percentComplete: 120.0,
      };

      const result = progressMapper.toWaterSummary(dto);

      expect(result.consumedMl).toBe(3000);
      expect(result.percentComplete).toBe(120.0);
      expect(result.visualPercent).toBe(100);
      expect(result.remainingMl).toBe(0);
    });
  });

  describe('toSleepRecord', () => {
    it('maps sleep record with localized quality label and formatted duration', () => {
      const dto: SleepResponseDto = {
        id: 'sleep-123',
        sleptAt: '2026-10-24T23:00:00Z',
        wokeAt: '2026-10-25T07:00:00Z',
        sleepQuality: 'Good',
        durationHours: 8.0,
        date: '2026-10-25',
      };

      const result = progressMapper.toSleepRecord(dto);

      expect(result.id).toBe('sleep-123');
      expect(result.sleepQuality).toBe(SleepQualityEnum.GOOD);
      expect(result.sleepQualityLabel).toBe('Tốt');
      expect(result.durationHours).toBe(8.0);
      expect(result.formattedDuration).toBe('8 giờ');
      expect(result.date).toBe('2026-10-25');
    });
  });

  describe('toBodyMetricRecord', () => {
    it('maps body metric record with formatted blood pressure', () => {
      const dto: BodyMetricResponseDto = {
        id: 'metric-456',
        loggedAt: '2026-10-25T07:30:00Z',
        weightKg: 70.0,
        bmi: 22.86,
        bmiCategory: 'NormalWeight',
        bodyFatPercent: 18.5,
        waistCircumferenceCm: 80.0,
        systolicBloodPressure: 120,
        diastolicBloodPressure: 80,
        restingHeartRate: 65,
      };

      const result = progressMapper.toBodyMetricRecord(dto);

      expect(result.id).toBe('metric-456');
      expect(result.weightKg).toBe(70.0);
      expect(result.bmi).toBe(22.86);
      expect(result.bmiCategory).toBe(BmiCategoryEnum.NORMAL_WEIGHT);
      expect(result.bmiCategoryLabel).toBe('Bình thường');
      expect(result.bodyFatPercent).toBe(18.5);
      expect(result.waistCircumferenceCm).toBe(80.0);
      expect(result.bloodPressureDisplay).toBe('120/80 mmHg');
      expect(result.restingHeartRate).toBe(65);
    });

    it('handles null optional metrics cleanly', () => {
      const dto: BodyMetricResponseDto = {
        id: 'metric-789',
        loggedAt: '2026-10-25T07:30:00Z',
        weightKg: 65.0,
        bmi: 21.2,
        bmiCategory: 'NormalWeight',
        bodyFatPercent: null,
        waistCircumferenceCm: null,
        systolicBloodPressure: null,
        diastolicBloodPressure: null,
        restingHeartRate: null,
      };

      const result = progressMapper.toBodyMetricRecord(dto);

      expect(result.bloodPressureDisplay).toBeNull();
      expect(result.bodyFatPercent).toBeNull();
      expect(result.waistCircumferenceCm).toBeNull();
      expect(result.restingHeartRate).toBeNull();
    });
  });

  describe('toMetricsHistory', () => {
    it('maps pagination metadata and derives hasNextPage/hasPrevPage safely', () => {
      const dto: MetricsHistoryResponseDto = {
        items: [
          {
            id: 'm1',
            loggedAt: '2026-10-25T07:30:00Z',
            weightKg: 70.0,
            bmi: 22.86,
            bmiCategory: 'NormalWeight',
          },
        ],
        pageNumber: 1,
        pageSize: 10,
        totalCount: 25,
        totalPages: 3,
      };

      const result = progressMapper.toMetricsHistory(dto);

      expect(result.items.length).toBe(1);
      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(false);
    });

    it('handles empty history response', () => {
      const result = progressMapper.toMetricsHistory(null);

      expect(result.items).toEqual([]);
      expect(result.pageNumber).toBe(1);
      expect(result.totalCount).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(false);
    });
  });
});
