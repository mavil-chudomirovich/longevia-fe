import { describe, expect, it } from 'vitest';
import { longevityComponentLabel, workoutActivityLabel } from './progress-labels';

describe('progress-labels', () => {
  it('dịch key hoạt động tập luyện sang tiếng Việt', () => {
    expect(workoutActivityLabel('walking')).toBe('Đi bộ');
    expect(workoutActivityLabel('running')).toBe('Chạy bộ');
    expect(workoutActivityLabel('gardening')).toBe('Làm vườn');
    expect(workoutActivityLabel('tai_chi')).toBe('Thái cực quyền');
  });

  it('không phân biệt hoa thường và cắt khoảng trắng', () => {
    expect(workoutActivityLabel('  CYCLING ')).toBe('Đạp xe');
  });

  it('humanize key lạ thay vì để lộ tiếng Anh/snake_case', () => {
    expect(workoutActivityLabel('stretching')).toBe('Stretching');
    expect(workoutActivityLabel('mobility_drill')).toBe('Mobility drill');
  });

  it('dịch key điểm thói quen trường thọ', () => {
    expect(longevityComponentLabel('fasting')).toBe('Nhịn ăn');
    expect(longevityComponentLabel('sleep')).toBe('Giấc ngủ');
    expect(longevityComponentLabel('hydration')).toBe('Nước uống');
    expect(longevityComponentLabel('nutrition')).toBe('Dinh dưỡng');
    expect(longevityComponentLabel('stress_management')).toBe('Stress management');
  });
});
