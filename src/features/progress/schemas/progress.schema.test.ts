import { describe, it, expect } from 'vitest';
import {
  startFastingSchema,
  endFastingSchema,
  logWaterSchema,
  logSleepSchema,
  logBodyMetricSchema,
} from './progress.schema';

describe('Progress Zod Schemas Unit Tests', () => {
  describe('startFastingSchema', () => {
    it('accepts valid 16:8 protocol with 16 target hours', () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
      const res = startFastingSchema.safeParse({
        protocol: '16:8',
        startedAt: pastTime,
        targetHours: 16,
      });
      expect(res.success).toBe(true);
    });

    it('rejects 16:8 protocol with mismatching targetHours', () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
      const res = startFastingSchema.safeParse({
        protocol: '16:8',
        startedAt: pastTime,
        targetHours: 14,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0]?.message).toContain('Giao thức 16:8 yêu cầu mục tiêu 16 giờ');
      }
    });

    it('accepts Custom protocol between 1 and 24 hours', () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
      const res = startFastingSchema.safeParse({
        protocol: 'Custom',
        startedAt: pastTime,
        targetHours: 12,
      });
      expect(res.success).toBe(true);
    });

    it('rejects Custom protocol > 24 hours', () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
      const res = startFastingSchema.safeParse({
        protocol: 'Custom',
        startedAt: pastTime,
        targetHours: 25,
      });
      expect(res.success).toBe(false);
    });

    it('rejects startedAt in the distant future', () => {
      const futureTime = new Date(Date.now() + 3600 * 1000).toISOString();
      const res = startFastingSchema.safeParse({
        protocol: '16:8',
        startedAt: futureTime,
        targetHours: 16,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('endFastingSchema', () => {
    it('accepts valid UUID session ID and past endedAt', () => {
      const res = endFastingSchema.safeParse({
        sessionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        endedAt: new Date(Date.now() - 1000).toISOString(),
      });
      expect(res.success).toBe(true);
    });

    it('rejects invalid session UUID', () => {
      const res = endFastingSchema.safeParse({
        sessionId: 'invalid-id',
        endedAt: new Date().toISOString(),
      });
      expect(res.success).toBe(false);
    });
  });

  describe('logWaterSchema', () => {
    it('accepts valid water amount between 1 and 5000 ml', () => {
      expect(logWaterSchema.safeParse({ amountMl: 250 }).success).toBe(true);
      expect(logWaterSchema.safeParse({ amountMl: 1 }).success).toBe(true);
      expect(logWaterSchema.safeParse({ amountMl: 5000 }).success).toBe(true);
    });

    it('rejects water amount 0 or negative', () => {
      expect(logWaterSchema.safeParse({ amountMl: 0 }).success).toBe(false);
      expect(logWaterSchema.safeParse({ amountMl: -100 }).success).toBe(false);
    });

    it('rejects water amount above 5000 ml', () => {
      expect(logWaterSchema.safeParse({ amountMl: 5001 }).success).toBe(false);
    });

    it('rejects floating point amounts', () => {
      expect(logWaterSchema.safeParse({ amountMl: 250.5 }).success).toBe(false);
    });
  });

  describe('logSleepSchema', () => {
    it('accepts valid sleep interval and quality', () => {
      const slept = new Date('2026-10-24T23:00:00Z').toISOString();
      const woke = new Date('2026-10-25T07:00:00Z').toISOString();

      const res = logSleepSchema.safeParse({
        sleptAt: slept,
        wokeAt: woke,
        sleepQuality: 'Good',
      });
      expect(res.success).toBe(true);
    });

    it('rejects wokeAt before or equal to sleptAt', () => {
      const slept = new Date('2026-10-25T07:00:00Z').toISOString();
      const woke = new Date('2026-10-25T06:00:00Z').toISOString();

      const res = logSleepSchema.safeParse({
        sleptAt: slept,
        wokeAt: woke,
        sleepQuality: 'Good',
      });
      expect(res.success).toBe(false);
    });

    it('rejects duration exceeding 24 hours', () => {
      const slept = new Date('2026-10-24T00:00:00Z').toISOString();
      const woke = new Date('2026-10-25T02:00:00Z').toISOString(); // 26 hours

      const res = logSleepSchema.safeParse({
        sleptAt: slept,
        wokeAt: woke,
        sleepQuality: 'Fair',
      });
      expect(res.success).toBe(false);
    });

    it('rejects invalid sleep quality enum', () => {
      const slept = new Date('2026-10-24T23:00:00Z').toISOString();
      const woke = new Date('2026-10-25T07:00:00Z').toISOString();

      const res = logSleepSchema.safeParse({
        sleptAt: slept,
        wokeAt: woke,
        sleepQuality: 'Amazing',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('logBodyMetricSchema', () => {
    it('accepts required weight with optional fields omitted or null', () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
      const res = logBodyMetricSchema.safeParse({
        loggedAt: pastTime,
        weightKg: 70.5,
        bodyFatPercent: null,
        waistCircumferenceCm: null,
        systolicBloodPressure: null,
        diastolicBloodPressure: null,
        restingHeartRate: null,
      });
      expect(res.success).toBe(true);
    });

    it('rejects weight outside 25.0..300.0 kg', () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
      expect(logBodyMetricSchema.safeParse({ loggedAt: pastTime, weightKg: 24.9 }).success).toBe(
        false
      );
      expect(logBodyMetricSchema.safeParse({ loggedAt: pastTime, weightKg: 300.1 }).success).toBe(
        false
      );
    });

    it('enforces blood pressure pair completeness', () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();

      // Only systolic -> should fail
      const sysOnly = logBodyMetricSchema.safeParse({
        loggedAt: pastTime,
        weightKg: 70.0,
        systolicBloodPressure: 120,
      });
      expect(sysOnly.success).toBe(false);

      // Only diastolic -> should fail
      const diaOnly = logBodyMetricSchema.safeParse({
        loggedAt: pastTime,
        weightKg: 70.0,
        diastolicBloodPressure: 80,
      });
      expect(diaOnly.success).toBe(false);

      // Both systolic and diastolic -> passes
      const both = logBodyMetricSchema.safeParse({
        loggedAt: pastTime,
        weightKg: 70.0,
        systolicBloodPressure: 120,
        diastolicBloodPressure: 80,
      });
      expect(both.success).toBe(true);
    });

    it('rejects systolic <= diastolic blood pressure', () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();
      const res = logBodyMetricSchema.safeParse({
        loggedAt: pastTime,
        weightKg: 70.0,
        systolicBloodPressure: 80,
        diastolicBloodPressure: 120,
      });
      expect(res.success).toBe(false);
    });

    it('rejects out-of-range optional biomarkers', () => {
      const pastTime = new Date(Date.now() - 3600 * 1000).toISOString();

      // Body fat > 100
      expect(
        logBodyMetricSchema.safeParse({
          loggedAt: pastTime,
          weightKg: 70.0,
          bodyFatPercent: 101,
        }).success
      ).toBe(false);

      // Waist > 300
      expect(
        logBodyMetricSchema.safeParse({
          loggedAt: pastTime,
          weightKg: 70.0,
          waistCircumferenceCm: 305,
        }).success
      ).toBe(false);

      // Heart rate < 25
      expect(
        logBodyMetricSchema.safeParse({
          loggedAt: pastTime,
          weightKg: 70.0,
          restingHeartRate: 20,
        }).success
      ).toBe(false);
    });
  });
});
