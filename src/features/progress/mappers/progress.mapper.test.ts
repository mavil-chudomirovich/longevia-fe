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
  FastingSessionResponseDto,
} from '../types/progress.dto';
import { parseRequiredInstant } from '../utils/progress-date';
import { ProgressDataIntegrityError } from '../errors/progress-data-integrity.error';

describe('ProgressMapper & Strict Timestamp Data Integrity (Corrective A)', () => {
  describe('parseRequiredInstant (25 Strict Timestamp Guarantees)', () => {
    it('1. accepts valid ISO 8601 with UTC Z indicator', () => {
      const instant = parseRequiredInstant('2026-11-04T12:30:00Z', 'testField');
      expect(instant.toISOString()).toBe('2026-11-04T12:30:00.000Z');
    });

    it('2. accepts valid positive UTC offset and preserves the actual instant', () => {
      const instant = parseRequiredInstant('2026-11-04T19:30:00+07:00', 'testField');
      expect(instant.toISOString()).toBe('2026-11-04T12:30:00.000Z');
    });

    it('3. accepts valid negative UTC offset and preserves the actual instant', () => {
      const instant = parseRequiredInstant('2026-11-04T07:30:00-05:00', 'testField');
      expect(instant.toISOString()).toBe('2026-11-04T12:30:00.000Z');
    });

    it('4. accepts fractional seconds', () => {
      const instant = parseRequiredInstant('2026-11-04T12:30:00.123Z', 'testField');
      expect(instant.toISOString()).toBe('2026-11-04T12:30:00.123Z');
    });

    it('5. rejects invalid timestamp string', () => {
      expect(() => parseRequiredInstant('invalid-date', 'testField')).toThrow(
        ProgressDataIntegrityError
      );
    });

    it('6. rejects missing mandatory timestamp (undefined)', () => {
      expect(() => parseRequiredInstant(undefined, 'testField')).toThrow(
        ProgressDataIntegrityError
      );
    });

    it('7. rejects explicit null mandatory timestamp', () => {
      expect(() => parseRequiredInstant(null, 'testField')).toThrow(ProgressDataIntegrityError);
    });

    it('8. rejects empty timestamp string', () => {
      expect(() => parseRequiredInstant('', 'testField')).toThrow(ProgressDataIntegrityError);
      expect(() => parseRequiredInstant('   ', 'testField')).toThrow(ProgressDataIntegrityError);
    });

    it('9. rejects timezone-less timestamp string', () => {
      expect(() => parseRequiredInstant('2026-11-04T12:30:00', 'testField')).toThrow(
        ProgressDataIntegrityError
      );
      expect(() => parseRequiredInstant('2026-11-04 12:30:00', 'testField')).toThrow(
        ProgressDataIntegrityError
      );
    });

    it('10. rejects impossible calendar date (Feb 30 without JavaScript rollover)', () => {
      expect(() => parseRequiredInstant('2026-02-30T10:00:00Z', 'testField')).toThrow(
        ProgressDataIntegrityError
      );
      expect(() => parseRequiredInstant('2026-04-31T10:00:00Z', 'testField')).toThrow(
        ProgressDataIntegrityError
      );
      expect(() => parseRequiredInstant('2025-02-29T10:00:00Z', 'testField')).toThrow(
        ProgressDataIntegrityError
      ); // 2025 is not leap
    });

    it('11. rejects impossible timezone offset', () => {
      expect(() => parseRequiredInstant('2026-11-04T12:30:00+25:00', 'testField')).toThrow(
        ProgressDataIntegrityError
      );
      expect(() => parseRequiredInstant('2026-11-04T12:30:00+14:30', 'testField')).toThrow(
        ProgressDataIntegrityError
      );
      expect(() => parseRequiredInstant('2026-11-04T12:30:00-15:00', 'testField')).toThrow(
        ProgressDataIntegrityError
      );
    });

    it('12. accepts valid Date object', () => {
      const d = new Date('2026-11-04T12:30:00.000Z');
      const instant = parseRequiredInstant(d, 'testField');
      expect(instant.getTime()).toBe(d.getTime());
    });

    it('13. rejects invalid Date object', () => {
      const d = new Date('invalid');
      expect(() => parseRequiredInstant(d, 'testField')).toThrow(ProgressDataIntegrityError);
    });

    it('rejects arbitrary numbers (timestamps must be canonical ISO strings or Dates)', () => {
      expect(() => parseRequiredInstant(1730723400000, 'testField')).toThrow(
        ProgressDataIntegrityError
      );
    });
  });

  describe('toCurrentFastingSession', () => {
    it('14. returns null for valid null or undefined active fasting response', () => {
      expect(progressMapper.toCurrentFastingSession(null)).toBeNull();
      expect(progressMapper.toCurrentFastingSession(undefined)).toBeNull();
    });

    it('14b. treats an empty body (HTTP 204) as no active session', () => {
      expect(progressMapper.toCurrentFastingSession('')).toBeNull();
      expect(progressMapper.toCurrentFastingSession('   ')).toBeNull();
    });

    it('15. rejects malformed non-null fasting response (empty object)', () => {
      expect(() => progressMapper.toCurrentFastingSession({} as CurrentFastingResponseDto)).toThrow(
        ProgressDataIntegrityError
      );
    });

    it('16. rejects fasting response with missing or blank session ID', () => {
      expect(() =>
        progressMapper.toCurrentFastingSession({
          sessionId: '   ',
          protocol: '16:8',
          startedAt: '2026-10-25T08:00:00Z',
          targetEndedAt: '2026-10-26T00:00:00Z',
          targetHours: 16,
          elapsedHours: 0,
          remainingHours: 16,
          status: 'InProgress',
        })
      ).toThrow(ProgressDataIntegrityError);
    });

    it('17. rejects fasting response with invalid startedAt', () => {
      expect(() =>
        progressMapper.toCurrentFastingSession({
          sessionId: 'session-123',
          protocol: '16:8',
          startedAt: 'invalid-date',
          targetEndedAt: '2026-10-26T00:00:00Z',
          targetHours: 16,
          elapsedHours: 0,
          remainingHours: 16,
          status: 'InProgress',
        })
      ).toThrow(ProgressDataIntegrityError);
    });

    it('18. rejects fasting response with invalid targetEndedAt', () => {
      expect(() =>
        progressMapper.toCurrentFastingSession({
          sessionId: 'session-123',
          protocol: '16:8',
          startedAt: '2026-10-25T08:00:00Z',
          targetEndedAt: 'timezone-less-2026-10-26T00:00:00',
          targetHours: 16,
          elapsedHours: 0,
          remainingHours: 16,
          status: 'InProgress',
        })
      ).toThrow(ProgressDataIntegrityError);
    });

    it('maps valid active fasting session accurately', () => {
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
      expect(result?.startedAt.toISOString()).toBe('2026-10-25T08:00:00.000Z');
      expect(result?.targetEndedAt.toISOString()).toBe('2026-10-26T00:00:00.000Z');
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
  });

  describe('toSleepRecord', () => {
    it('19. rejects sleep record with invalid sleptAt', () => {
      const dto: SleepResponseDto = {
        id: 'sleep-1',
        sleptAt: 'not-a-date',
        wokeAt: '2026-10-25T07:00:00Z',
        sleepQuality: 'Good',
        durationHours: 8,
        date: '2026-10-25',
      };
      expect(() => progressMapper.toSleepRecord(dto)).toThrow(ProgressDataIntegrityError);
    });

    it('20. rejects sleep record with invalid wokeAt', () => {
      const dto: SleepResponseDto = {
        id: 'sleep-1',
        sleptAt: '2026-10-24T23:00:00Z',
        wokeAt: '2026-10-25T07:00:00', // no timezone
        sleepQuality: 'Good',
        durationHours: 8,
        date: '2026-10-25',
      };
      expect(() => progressMapper.toSleepRecord(dto)).toThrow(ProgressDataIntegrityError);
    });

    it('maps valid sleep record with localized quality label and formatted duration', () => {
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
      expect(result.sleptAt.toISOString()).toBe('2026-10-24T23:00:00.000Z');
      expect(result.wokeAt.toISOString()).toBe('2026-10-25T07:00:00.000Z');
      expect(result.sleepQuality).toBe(SleepQualityEnum.GOOD);
      expect(result.sleepQualityLabel).toBe('Tốt');
      expect(result.durationHours).toBe(8.0);
      expect(result.formattedDuration).toBe('8 giờ');
      expect(result.date).toBe('2026-10-25');
    });
  });

  describe('toBodyMetricRecord', () => {
    it('21. rejects body metric record with missing loggedAt', () => {
      const dto = {
        id: 'm1',
        weightKg: 70,
        bmi: 22.8,
      } as unknown as BodyMetricResponseDto;

      expect(() => progressMapper.toBodyMetricRecord(dto)).toThrow(ProgressDataIntegrityError);
    });

    it('22. rejects body metric record with invalid loggedAt', () => {
      const dto: BodyMetricResponseDto = {
        id: 'm1',
        loggedAt: '2026-13-45T10:00:00Z',
        weightKg: 70,
        bmi: 22.8,
        bmiCategory: 'NormalWeight',
      };

      expect(() => progressMapper.toBodyMetricRecord(dto)).toThrow(ProgressDataIntegrityError);
    });

    it('24. correctly formats the validated metric timestamp matching the model instant', () => {
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
      expect(result.loggedAt.toISOString()).toBe('2026-10-25T07:30:00.000Z');
      // formattedLoggedAt must match the exact validated loggedAt date
      expect(result.formattedLoggedAt).toContain('25/10/2026');
      expect(result.weightKg).toBe(70.0);
      expect(result.bmi).toBe(22.86);
      expect(result.bmiCategory).toBe(BmiCategoryEnum.NORMAL_WEIGHT);
      expect(result.bloodPressureDisplay).toBe('120/80 mmHg');
    });
  });

  describe('toMetricsHistory', () => {
    it('23. fails entire history response when an item has an invalid timestamp', () => {
      const dto: MetricsHistoryResponseDto = {
        items: [
          {
            id: 'm1',
            loggedAt: '2026-10-25T07:30:00Z',
            weightKg: 70.0,
            bmi: 22.86,
            bmiCategory: 'NormalWeight',
          },
          {
            id: 'm2-corrupted',
            loggedAt: 'invalid-timestamp',
            weightKg: 72.0,
            bmi: 23.5,
            bmiCategory: 'NormalWeight',
          },
        ],
        pageNumber: 1,
        pageSize: 10,
        totalCount: 2,
        totalPages: 1,
      };

      expect(() => progressMapper.toMetricsHistory(dto)).toThrow(ProgressDataIntegrityError);
    });

    it('maps valid history with pagination metadata correctly', () => {
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
      expect(result.items[0].id).toBe('m1');
      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(false);
    });
  });

  describe('toDashboardSummary', () => {
    it('maps complete dashboard summary DTO correctly and preserves nulls', () => {
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

    it('preserves null values without coercing to zero', () => {
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
      expect(result.averageSleepHours).toBeNull();
      expect(result.hasRecordedMetrics).toBe(false);
    });

    it('prioritizes backend bmiCategory over local calculation when present', () => {
      const dto: DashboardSummaryResponseDto = {
        currentWeightKg: 70.0,
        currentBmi: 22.0,
        bmiCategory: 'Overweight',
      } as DashboardSummaryResponseDto;

      const result = progressMapper.toDashboardSummary(dto);
      expect(result.bmiCategory).toBe(BmiCategoryEnum.OVERWEIGHT);
      expect(result.bmiCategoryLabel).toBe('Thừa cân');
    });
  });

  describe('toWaterSummary', () => {
    it('maps water summary correctly', () => {
      const dto: WaterSummaryResponseDto = {
        date: '2026-10-25',
        consumedMl: 1000,
        targetMl: 2500,
        percentComplete: 40.0,
        latestLogId: 'log-1',
      };

      const result = progressMapper.toWaterSummary(dto);

      expect(result.date).toBe('2026-10-25');
      expect(result.consumedMl).toBe(1000);
      expect(result.targetMl).toBe(2500);
      expect(result.percentComplete).toBe(40.0);
      expect(result.visualPercent).toBe(40.0);
      expect(result.remainingMl).toBe(1500);
      expect(result.latestLogId).toBe('log-1');
    });

    it('normalizes a missing latestLogId to null', () => {
      const result = progressMapper.toWaterSummary({
        date: '2026-10-25',
        consumedMl: 0,
        targetMl: 2500,
        percentComplete: 0,
      });
      expect(result.latestLogId).toBeNull();
    });
  });
});
