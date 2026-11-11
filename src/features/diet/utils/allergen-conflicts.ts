import { normalizeText } from '@/lib/text';
import { groupKeysForText } from '@/common/constants/allergen-labels';

/**
 * So khớp dị ứng giữa hồ sơ người dùng (free-text) và tag dị nguyên của món.
 *
 * Quy tắc:
 * - So khớp theo nhóm đồng nghĩa trước (vd. "sữa" ↔ "milk", "hải sản" ↔ "cá").
 * - Sau đó so khớp theo từ, giữ dấu: "cá" không khớp "cà chua".
 * - Chỉ bỏ dấu khi so sánh từ có từ 3 ký tự trở lên, để hỗ trợ người gõ
 *   "dau phong" mà không tạo false positive cho "cà"/"cá".
 * - Đây là cảnh báo an toàn phía UI, không thay thế việc BE lọc ứng viên gợi ý.
 */
function tokens(value: string): string[] {
  return value
    .normalize('NFC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function singular(token: string): string {
  return token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token;
}

function tokenMatches(left: string, right: string): boolean {
  if (left === right) return true;
  if (singular(left) === singular(right)) return true;
  // Bỏ dấu chỉ khi cả hai từ đủ dài, tránh "cà" khớp "cá".
  return left.length >= 3 && right.length >= 3 && normalizeText(left) === normalizeText(right);
}

function containsAsWords(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || haystack.length < needle.length) return false;
  for (let start = 0; start <= haystack.length - needle.length; start += 1) {
    let matched = true;
    for (let index = 0; index < needle.length; index += 1) {
      if (!tokenMatches(haystack[start + index], needle[index])) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
}

export interface AllergenConflict {
  /** Tag gốc của món (đã chuẩn hoá lowercase từ BE). */
  tag: string;
  /** Dị ứng khai báo trong hồ sơ khớp với tag này. */
  allergy: string;
}

interface AllergyEntry {
  raw: string;
  tokens: string[];
  keys: Set<string>;
}

function matches(tag: string, allergy: AllergyEntry): boolean {
  const tagTokens = tokens(tag);
  if (tagTokens.length === 0) return false;

  // Cùng một cụm, chỉ khác dấu/hoa thường (vd. "lua mi" ↔ "lúa mì").
  if (normalizeText(tag) === normalizeText(allergy.raw)) return true;

  const tagKeys = groupKeysForText(tag);
  for (const key of tagKeys) {
    if (allergy.keys.has(key)) return true;
  }

  return containsAsWords(allergy.tokens, tagTokens) || containsAsWords(tagTokens, allergy.tokens);
}

export function findConflictedAllergens(
  foodAllergens: readonly string[] | null | undefined,
  userAllergies: readonly string[] | null | undefined
): AllergenConflict[] {
  if (!foodAllergens?.length || !userAllergies?.length) return [];

  const allergies: AllergyEntry[] = userAllergies
    .map((allergy) => ({
      raw: allergy.trim(),
      tokens: tokens(allergy),
      keys: groupKeysForText(allergy),
    }))
    .filter((entry) => entry.tokens.length > 0);

  const conflicts: AllergenConflict[] = [];
  for (const tag of foodAllergens) {
    const match = allergies.find((allergy) => matches(tag, allergy));
    if (match) conflicts.push({ tag, allergy: match.raw });
  }
  return conflicts;
}

export function hasAllergenConflict(
  foodAllergens: readonly string[] | null | undefined,
  userAllergies: readonly string[] | null | undefined
): boolean {
  return findConflictedAllergens(foodAllergens, userAllergies).length > 0;
}
