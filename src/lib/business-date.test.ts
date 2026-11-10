import { describe, expect, it } from 'vitest';
import {
  addBusinessWeeks,
  formatBusinessWeekRange,
  getBusinessWeekDays,
  getBusinessWeekStart,
  isCurrentBusinessWeek,
} from './business-date';

describe('business-date week helpers', () => {
  it('normalizes any date to Monday', () => {
    expect(getBusinessWeekStart('2026-11-12')).toBe('2026-11-09');
    expect(getBusinessWeekStart('2026-11-09')).toBe('2026-11-09');
    expect(getBusinessWeekStart('2026-11-15')).toBe('2026-11-09');
  });

  it('adds and subtracts weeks', () => {
    expect(addBusinessWeeks('2026-11-09', 1)).toBe('2026-11-16');
    expect(addBusinessWeeks('2026-11-09', -1)).toBe('2026-11-02');
  });

  it('returns seven days starting Monday', () => {
    expect(getBusinessWeekDays('2026-11-11')).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ]);
  });

  it('formats the week range', () => {
    expect(formatBusinessWeekRange('2026-11-09')).toBe('Tuần 09/11 – 15/11/2026');
  });

  it('detects the current week', () => {
    const reference = new Date(2026, 10, 12, 12, 0, 0);
    expect(isCurrentBusinessWeek('2026-11-09', reference)).toBe(true);
    expect(isCurrentBusinessWeek('2026-11-16', reference)).toBe(false);
  });
});
