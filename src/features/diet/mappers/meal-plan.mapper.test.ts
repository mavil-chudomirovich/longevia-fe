import { describe, expect, it } from 'vitest';
import { mealPlanMapper } from './meal-plan.mapper';

describe('mealPlanMapper fallback reason', () => {
  it('giữ lý do fallback để UI hiển thị đúng nguyên nhân', () => {
    const model = mealPlanMapper.toModel({
      id: 'plan-1',
      weekStartDate: '2026-11-09',
      usedFallback: true,
      usedFallbackReason: 'provider_timeout',
    });

    expect(model.usedFallback).toBe(true);
    expect(model.usedFallbackReason).toBe('provider_timeout');
  });

  it('trả null khi backend cũ không có trường này hoặc không fallback', () => {
    const model = mealPlanMapper.toModel({ id: 'plan-1', weekStartDate: '2026-11-09' });

    expect(model.usedFallback).toBe(false);
    expect(model.usedFallbackReason).toBeNull();
  });
});
