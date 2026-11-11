/**
 * Nhóm dị nguyên phổ biến.
 *
 * BE lưu mỗi món một mảng tag đã chuẩn hoá (lowercase) gồm cả tiếng Anh và từ
 * đồng nghĩa tiếng Việt để so khớp với hồ sơ dị ứng dạng free-text. UI gộp các
 * từ đồng nghĩa về một nhãn duy nhất để không hiển thị "lúa mì, wheat, gluten".
 */
export interface AllergenGroup {
  key: string;
  label: string;
  aliases: string[];
}

export const ALLERGEN_GROUPS: AllergenGroup[] = [
  { key: 'egg', label: 'Trứng', aliases: ['egg', 'trứng'] },
  { key: 'milk', label: 'Sữa', aliases: ['milk', 'sữa', 'lactose'] },
  { key: 'fish', label: 'Cá', aliases: ['fish', 'cá'] },
  {
    key: 'shellfish',
    label: 'Động vật có vỏ (tôm, cua)',
    aliases: ['shellfish', 'tôm', 'giáp xác'],
  },
  { key: 'mollusc', label: 'Nhuyễn thể (mực, ốc)', aliases: ['mollusc', 'mực', 'nhuyễn thể'] },
  { key: 'soy', label: 'Đậu nành', aliases: ['soy', 'đậu nành'] },
  { key: 'gluten', label: 'Lúa mì / Gluten', aliases: ['gluten', 'wheat', 'lúa mì'] },
  { key: 'peanut', label: 'Đậu phộng (lạc)', aliases: ['peanut', 'đậu phộng', 'lạc'] },
  { key: 'sesame', label: 'Mè (vừng)', aliases: ['sesame', 'mè', 'vừng'] },
  { key: 'tree_nut', label: 'Hạt cây', aliases: ['tree_nut', 'tree nut', 'hạt cây'] },
  { key: 'seafood', label: 'Hải sản', aliases: ['seafood', 'hải sản'] },
];

/**
 * Một chuỗi có thể thuộc nhiều nhóm: "hải sản" bao hàm cá, động vật có vỏ và
 * nhuyễn thể nên phải khớp với tag của cả ba nhóm.
 */
const KEY_ALIASES: Record<string, string[]> = Object.fromEntries(
  ALLERGEN_GROUPS.map((group) => [group.key, group.aliases])
);

const TEXT_TO_KEYS = new Map<string, Set<string>>();
const ALIAS_TO_GROUP = new Map<string, AllergenGroup>();

function register(text: string, key: string): void {
  const normalized = text.trim().toLowerCase();
  const keys = TEXT_TO_KEYS.get(normalized) ?? new Set<string>();
  keys.add(key);
  TEXT_TO_KEYS.set(normalized, keys);
}

for (const group of ALLERGEN_GROUPS) {
  for (const alias of KEY_ALIASES[group.key] ?? []) {
    register(alias, group.key);
    ALIAS_TO_GROUP.set(alias.trim().toLowerCase(), group);
  }
}
for (const key of ['fish', 'shellfish', 'mollusc', 'seafood']) {
  register('hải sản', key);
}

/** Các nhóm dị nguyên mà một tag/chuỗi hồ sơ thuộc về (khớp exact, có dấu). */
export function groupKeysForText(text: string | null | undefined): Set<string> {
  if (!text) return new Set();
  return TEXT_TO_KEYS.get(text.trim().toLowerCase()) ?? new Set();
}

/** Món này có chứa tag thuộc nhóm dị nguyên nào (nếu có). */
export function findGroupsForTags(tags: readonly string[] | null | undefined): AllergenGroup[] {
  if (!tags) return [];
  const found = new Map<string, AllergenGroup>();
  for (const tag of tags) {
    const group = ALIAS_TO_GROUP.get(tag.trim().toLowerCase());
    if (group) found.set(group.key, group);
  }
  return [...found.values()];
}

function capitalize(label: string): string {
  if (!label) return label;
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

/**
 * Nhãn hiển thị cho danh sách tag của món: gộp đồng nghĩa, giữ tag lạ nguyên bản.
 */
export function toDisplayAllergens(tags: readonly string[] | null | undefined): string[] {
  if (!tags || tags.length === 0) return [];
  const labels = findGroupsForTags(tags).map((group) => group.label);

  for (const tag of tags) {
    if (ALIAS_TO_GROUP.has(tag.trim().toLowerCase())) continue;
    const trimmed = tag.trim();
    if (trimmed.length > 0) labels.push(capitalize(trimmed));
  }

  return [...new Set(labels)];
}
