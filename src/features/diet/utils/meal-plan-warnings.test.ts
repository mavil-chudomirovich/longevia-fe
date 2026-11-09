import { describe, expect, it } from 'vitest';
import { partitionWarnings } from './meal-plan-warnings';
import type { MealPlanWarningModel } from '../types/meal-plan.model';

function warning(scope: string, message = 'cảnh báo'): MealPlanWarningModel {
  return { code: 'fiber_below_target', message, scope };
}

describe('partitionWarnings', () => {
  it('gắn cảnh báo theo ngày vào đúng ngày và giữ cảnh báo khác ở global', () => {
    const result = partitionWarnings(
      [warning('2026-11-09', 'thiếu xơ'), warning('plan', 'dùng phương án dự phòng')],
      ['2026-11-09', '2026-11-10']
    );

    expect(result.byDate['2026-11-09']).toEqual([warning('2026-11-09', 'thiếu xơ')]);
    expect(result.byDate['2026-11-10']).toBeUndefined();
    expect(result.global).toEqual([warning('plan', 'dùng phương án dự phòng')]);
  });

  it('không làm mất cảnh báo trùng scope và giữ thứ tự', () => {
    const result = partitionWarnings(
      [warning('2026-11-09', 'a'), warning('2026-11-09', 'b')],
      ['2026-11-09']
    );

    expect(result.byDate['2026-11-09'].map((item) => item.message)).toEqual(['a', 'b']);
    expect(result.global).toEqual([]);
  });

  it('trả về rỗng khi không có cảnh báo', () => {
    expect(partitionWarnings([], ['2026-11-09'])).toEqual({ global: [], byDate: {} });
  });
});
