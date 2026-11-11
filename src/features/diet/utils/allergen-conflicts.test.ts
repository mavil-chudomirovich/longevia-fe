import { describe, expect, it } from 'vitest';
import { findConflictedAllergens, hasAllergenConflict } from './allergen-conflicts';

describe('allergen confirmation', () => {
  it('matches Vietnamese synonyms and ignores case/diacritics', () => {
    expect(hasAllergenConflict(['peanut', 'đậu phộng', 'lạc'], ['Đậu Phộng'])).toBe(true);
    expect(hasAllergenConflict(['gluten', 'wheat', 'lúa mì'], ['lua mi'])).toBe(true);
    expect(hasAllergenConflict(['milk', 'sữa'], ['SỮA'])).toBe(true);
  });

  it('matches a phrase inside a longer allergy declaration', () => {
    expect(hasAllergenConflict(['fish', 'cá'], ['dị ứng cá hồi'])).toBe(true);
  });

  it('handles English plurals', () => {
    expect(hasAllergenConflict(['peanut'], ['peanuts'])).toBe(true);
  });

  it('matches aliases without diacritics when the word is long enough', () => {
    expect(hasAllergenConflict(['đậu phộng'], ['dau phong'])).toBe(true);
  });

  it('does not confuse "cá" with "cà chua"', () => {
    expect(hasAllergenConflict(['cá'], ['cà chua'])).toBe(false);
    expect(hasAllergenConflict(['cà chua'], ['cá'])).toBe(false);
  });

  it('treats "hải sản" as covering fish, shellfish and molluscs', () => {
    expect(hasAllergenConflict(['fish', 'cá'], ['hải sản'])).toBe(true);
    expect(hasAllergenConflict(['shellfish', 'tôm'], ['hải sản'])).toBe(true);
  });

  it('does not report conflicts when none are declared', () => {
    expect(hasAllergenConflict(['gluten'], [])).toBe(false);
    expect(hasAllergenConflict(null, ['đậu phộng'])).toBe(false);
    expect(hasAllergenConflict([], ['đậu phộng'])).toBe(false);
  });

  it('returns the offending tag and allergy for the warning copy', () => {
    const conflicts = findConflictedAllergens(['peanut', 'đậu phộng'], ['Đậu phộng']);
    expect(conflicts).toHaveLength(2);
    expect(conflicts[0]).toEqual({ tag: 'peanut', allergy: 'Đậu phộng' });
  });
});
