import { describe, expect, it } from 'vitest';
import { progressAiMapper } from './progress-ai.mapper';

describe('progressAiMapper workout', () => {
  it('giữ activityLabel tiếng Việt và lý do fallback', () => {
    const model = progressAiMapper.toWorkoutPlan({
      id: 'plan-1',
      weekStartDate: '2026-11-09',
      usedFallback: true,
      usedFallbackReason: 'corpus_missing',
      days: [
        { date: '2026-11-09', activity: 'walking', activityLabel: 'Đi bộ' },
        { date: '2026-11-10', restDay: true },
      ],
    });

    expect(model.usedFallbackReason).toBe('corpus_missing');
    expect(model.days[0].activityLabel).toBe('Đi bộ');
    expect(model.days[1].activityLabel).toBe('');
  });

  it('trả null khi backend cũ không có usedFallbackReason', () => {
    const model = progressAiMapper.toWorkoutPlan({ id: 'plan-1', weekStartDate: '2026-11-09' });

    expect(model.usedFallbackReason).toBeNull();
  });
});
