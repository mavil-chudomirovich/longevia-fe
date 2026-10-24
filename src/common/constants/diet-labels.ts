import { DietPattern, Tradition } from '@/common/enums';

/**
 * Bản đồ tên tiếng Việt chuẩn hóa cho các chất gây dị ứng phổ biến.
 */
export const ALLERGEN_NAMES: Record<string, string> = {
  SOY: 'Đậu nành',
  PEANUT: 'Đậu phộng (lạc)',
  TREE_NUT: 'Hạt cây',
  TREE_NUTS: 'Hạt cây',
  GLUTEN: 'Gluten (lúa mì)',
  SESAME: 'Mè (vừng)',
  MILK: 'Sữa bò / Chế phẩm sữa',
  EGG: 'Trứng gia cầm',
  CELERY: 'Cần tây',
  MUSTARD: 'Mù tạt',
  SULFITES: 'Sulfite',
  SULFITE: 'Sulfite',
  FISH: 'Cá',
  SHELLFISH: 'Hải sản có vỏ',
  CRUSTACEAN: 'Giáp xác',
  MOLLUSC: 'Thân mềm',
  LUPIN: 'Đậu lupin',
  WHEAT: 'Lúa mì',
  DAIRY: 'Sữa bò / Chế phẩm sữa',
  CORN: 'Bắp (ngô)',
};

/**
 * Lấy tên tiếng Việt thân thiện của chất dị ứng từ mã backend.
 */
export function getAllergenName(code?: string | null): string {
  if (!code) return '';
  const trimmed = code.trim();
  const upper = trimmed.toUpperCase();
  return ALLERGEN_NAMES[upper] || trimmed;
}

/**
 * Bản đồ tên tiếng Việt của các trường phái / truyền thống ăn chay.
 */
export const TRADITION_NAMES: Record<string, string> = {
  [Tradition.NONE]: 'Không theo truyền thống',
  [Tradition.BUDDHIST]: 'Phật giáo',
  [Tradition.CHRISTIAN]: 'Kitô giáo',
  PHAT_GIAO: 'Phật giáo',
  DAO_GIAO: 'Đạo giáo',
  TAOIST: 'Đạo giáo',
  THUAN_CHAY: 'Thuần chay',
};

/**
 * Lấy tên tiếng Việt của truyền thống ăn chay.
 */
export function getTraditionName(tradition?: string | null): string {
  if (!tradition) return '';
  const trimmed = tradition.trim();
  const upper = trimmed.toUpperCase();
  return TRADITION_NAMES[upper] || trimmed;
}

/**
 * Bản đồ tên tiếng Việt của các kiểu ăn chay (DietPattern).
 */
export const DIET_PATTERN_NAMES: Record<string, string> = {
  [DietPattern.VEGAN]: 'Thuần chay',
  [DietPattern.LACTO_OVO]: 'Có trứng sữa',
  LACTO_VEGETARIAN: 'Chay có sữa',
  OVO_VEGETARIAN: 'Chay có trứng',
  LACTO_OVO_VEGETARIAN: 'Chay có trứng sữa',
};

/**
 * Lấy tên tiếng Việt của kiểu ăn chay.
 */
export function getDietPatternName(pattern?: string | null): string {
  if (!pattern) return '';
  const trimmed = pattern.trim();
  const upper = trimmed.toUpperCase();
  return DIET_PATTERN_NAMES[upper] || trimmed;
}

/**
 * Bản đồ lý do không tương thích chế độ ăn.
 */
export const DIET_REASON_NAMES: Record<string, string> = {
  UNRESOLVED_INGREDIENT: 'Nguyên liệu chưa được chuẩn hóa',
  MISSING_COMPATIBILITY_METADATA: 'Thiếu thông tin tương thích',
};

/**
 * Lấy mô tả tiếng Việt thân thiện của mã lý do không tương thích.
 */
export function getDietReasonLabel(reasonCode?: string | null): string {
  if (!reasonCode) return '';
  const trimmed = reasonCode.trim();
  if (DIET_REASON_NAMES[trimmed]) return DIET_REASON_NAMES[trimmed];
  if (trimmed.startsWith('INCOMPATIBLE_INGREDIENT')) {
    return 'Chứa nguyên liệu không phù hợp';
  }
  return trimmed;
}
