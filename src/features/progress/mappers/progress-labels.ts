/**
 * Nhãn tiếng Việt cho các key ổn định mà backend trả về. Key là contract (không
 * đổi), nhãn là chuyện hiển thị nên FE giữ bảng dịch riêng; key lạ được
 * "humanize" để không bao giờ lộ snake_case tiếng Anh ra UI.
 */
const WORKOUT_ACTIVITY_LABELS: Record<string, string> = {
  walking: 'Đi bộ',
  cycling: 'Đạp xe',
  running: 'Chạy bộ',
  swimming: 'Bơi',
  strength: 'Tập tạ',
  tai_chi: 'Thái cực quyền',
  dancing: 'Nhảy múa',
  gardening: 'Làm vườn',
};

const LONGEVITY_COMPONENT_LABELS: Record<string, string> = {
  fasting: 'Nhịn ăn',
  sleep: 'Giấc ngủ',
  hydration: 'Nước uống',
  nutrition: 'Dinh dưỡng',
};

function humanizeKey(key: string): string {
  const normalized = key.replace(/[_-]+/g, ' ').trim();
  if (normalized.length === 0) return key;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function workoutActivityLabel(key: string): string {
  const normalized = key.trim().toLowerCase();
  return WORKOUT_ACTIVITY_LABELS[normalized] ?? humanizeKey(key);
}

export function longevityComponentLabel(key: string): string {
  const normalized = key.trim().toLowerCase();
  return LONGEVITY_COMPONENT_LABELS[normalized] ?? humanizeKey(key);
}

/** Nhãn cường độ: backend đã trả tiếng Việt, chỉ chuẩn hoá khoảng trắng. */
export function workoutIntensityLabel(intensity: string): string {
  return intensity.trim();
}
