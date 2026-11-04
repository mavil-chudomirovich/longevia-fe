import { describe, it, expect } from 'vitest';
import {
  getUtcTodayDateString,
  toUtcInstantIsoString,
  parseUtcDateOnly,
  formatDateOnlyDisplay,
  formatDisplayDateTime,
  formatDisplayTime,
  calculateInstantDifferenceHours,
  formatDurationHours,
  isFutureInstant,
  toLocalInputDateTimeString,
  localInputToUtcIsoString,
} from './progress-date';

describe('Progress Date Utilities (Q01 / ADR005 Canonical UTC Policy)', () => {
  describe('getUtcTodayDateString - VN midnight vs UTC midnight boundaries', () => {
    it('returns previous day for Vietnam 00:30 (still previous day in UTC)', () => {
      // 2026-11-05T00:30:00+07:00 is 2026-11-04T17:30:00.000Z
      const dateVnMidnight = new Date('2026-11-04T17:30:00.000Z');
      expect(getUtcTodayDateString(dateVnMidnight)).toBe('2026-11-04');
    });

    it('returns previous day for Vietnam 06:59:59 (+07:00)', () => {
      // 2026-11-05T06:59:59+07:00 is 2026-11-04T23:59:59.000Z
      const dateVnJustBeforeUtcMidnight = new Date('2026-11-04T23:59:59.000Z');
      expect(getUtcTodayDateString(dateVnJustBeforeUtcMidnight)).toBe('2026-11-04');
    });

    it('advances to new day exactly at Vietnam 07:00:00 (+07:00) when UTC reaches 00:00', () => {
      // 2026-11-05T07:00:00+07:00 is 2026-11-05T00:00:00.000Z
      const dateVnUtcMidnight = new Date('2026-11-05T00:00:00.000Z');
      expect(getUtcTodayDateString(dateVnUtcMidnight)).toBe('2026-11-05');
    });

    it('formats single-digit months and days with leading zeros', () => {
      const date = new Date('2026-03-05T12:00:00.000Z');
      expect(getUtcTodayDateString(date)).toBe('2026-03-05');
    });
  });

  describe('toUtcInstantIsoString', () => {
    it('converts date to ISO 8601 string ending with Z', () => {
      const date = new Date('2026-10-25T08:00:00.000Z');
      expect(toUtcInstantIsoString(date)).toBe('2026-10-25T08:00:00.000Z');
    });

    it('throws error on invalid date input', () => {
      expect(() => toUtcInstantIsoString('invalid-date')).toThrow();
    });
  });

  describe('parseUtcDateOnly', () => {
    it('parses YYYY-MM-DD into a Date matching UTC midnight', () => {
      const parsed = parseUtcDateOnly('2026-10-25');
      expect(parsed.getUTCFullYear()).toBe(2026);
      expect(parsed.getUTCMonth()).toBe(9); // 0-indexed October
      expect(parsed.getUTCDate()).toBe(25);
      expect(parsed.getUTCHours()).toBe(0);
      expect(parsed.getUTCMinutes()).toBe(0);
      expect(parsed.toISOString()).toBe('2026-10-25T00:00:00.000Z');
    });

    it('throws on invalid DateOnly format', () => {
      expect(() => parseUtcDateOnly('2026/10/25')).toThrow();
    });
  });

  describe('formatDateOnlyDisplay', () => {
    it('formats YYYY-MM-DD to DD/MM/YYYY for Vietnamese UI', () => {
      expect(formatDateOnlyDisplay('2026-10-25')).toBe('25/10/2026');
    });

    it('handles null/undefined gracefully', () => {
      expect(formatDateOnlyDisplay(null)).toBe('Chưa có');
      expect(formatDateOnlyDisplay(undefined)).toBe('Chưa có');
    });
  });

  describe('formatDisplayDateTime and formatDisplayTime', () => {
    it('formats instant into local date and time', () => {
      const d = new Date('2026-10-25T10:30:00.000Z');
      expect(formatDisplayDateTime(d)).toMatch(/\d{2}:\d{2} - \d{2}\/\d{2}\/\d{4}/);
      expect(formatDisplayTime(d)).toMatch(/\d{2}:\d{2}/);
    });

    it('handles null and undefined gracefully', () => {
      expect(formatDisplayDateTime(null)).toBe('Chưa ghi nhận');
      expect(formatDisplayTime(null)).toBe('--:--');
    });
  });

  describe('calculateInstantDifferenceHours', () => {
    it('calculates exact decimal hours between two instants', () => {
      const start = '2026-10-25T08:00:00.000Z';
      const end = '2026-10-26T00:15:00.000Z';
      const diff = calculateInstantDifferenceHours(start, end);
      expect(diff).toBeCloseTo(16.25, 2);
    });

    it('returns 0 if end is before start', () => {
      const start = '2026-10-25T10:00:00.000Z';
      const end = '2026-10-25T08:00:00.000Z';
      expect(calculateInstantDifferenceHours(start, end)).toBe(0);
    });
  });

  describe('formatDurationHours', () => {
    it('formats whole hours', () => {
      expect(formatDurationHours(8)).toBe('8 giờ');
    });

    it('formats fractional hours into hours and minutes', () => {
      expect(formatDurationHours(16.5)).toBe('16 giờ 30 phút');
      expect(formatDurationHours(16.25)).toBe('16 giờ 15 phút');
    });

    it('formats sub-hour durations in minutes', () => {
      expect(formatDurationHours(0.75)).toBe('45 phút');
    });

    it('handles zero or negative duration', () => {
      expect(formatDurationHours(0)).toBe('0 phút');
      expect(formatDurationHours(-2)).toBe('0 phút');
    });
  });

  describe('isFutureInstant', () => {
    it('returns false for past instants', () => {
      const past = new Date(Date.now() - 3600 * 1000);
      expect(isFutureInstant(past)).toBe(false);
    });

    it('allows instants within 1 minute tolerance', () => {
      const slightlyFuture = new Date(Date.now() + 30 * 1000);
      expect(isFutureInstant(slightlyFuture, 1)).toBe(false);
    });

    it('returns true for distant future instants', () => {
      const distantFuture = new Date(Date.now() + 10 * 60 * 1000);
      expect(isFutureInstant(distantFuture, 1)).toBe(true);
    });
  });

  describe('datetime-local input helpers', () => {
    it('formats local input datetime correctly', () => {
      const str = toLocalInputDateTimeString(new Date('2026-10-25T12:30:00.000Z'));
      expect(str).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('roundtrips local datetime to UTC ISO string', () => {
      const iso = localInputToUtcIsoString('2026-10-25T14:30');
      expect(iso).toMatch(/^2026-10-25T\d{2}:\d{2}:00\.000Z$/);
    });
  });
});
