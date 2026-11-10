import { describe, expect, it } from 'vitest';
import { dietMapper } from '@/features/diet/mappers/diet.mapper';

describe('DietMapper', () => {
  it('maps paged foods and preserves nullable allergens', () => {
    const page = dietMapper.toFoodPage({
      items: [{ id: 'food-1', name: 'Yến mạch', calories: 120, allergens: null }],
      pageNumber: 2,
      pageSize: 20,
      totalCount: 21,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false,
    });

    expect(page).toMatchObject({ pageNumber: 2, hasPreviousPage: true, hasNextPage: false });
    expect(page.items[0]).toMatchObject({
      id: 'food-1',
      name: 'Yến mạch',
      calories: 120,
      allergens: null,
    });
  });

  it('preserves nullable calculated targets and unverified citation state', () => {
    const target = dietMapper.toTarget({ bmr: null, tdee: null, targetCalories: 1800 });
    const recommendations = dietMapper.toRecommendations({
      disclaimer: 'Thông tin chỉ mang tính tham khảo.',
      safetyNote: 'Tham khảo chuyên gia khi cần.',
      recommendedMeals: [
        {
          foodId: 'food-1',
          name: 'Yến mạch',
          citations: [{ chapterNumber: 3, verified: false, quote: 'Nguồn trích dẫn.' }],
        },
      ],
    });

    expect(target).toMatchObject({ bmr: null, tdee: null, targetCalories: 1800 });
    expect(recommendations).toMatchObject({
      disclaimer: 'Thông tin chỉ mang tính tham khảo.',
      safetyNote: 'Tham khảo chuyên gia khi cần.',
      recommendedMeals: [{ citations: [{ chapterNumber: 3, verified: false }] }],
    });
  });

  it('maps AI target suggestion and normalizes unknown source to formula', () => {
    const ai = dietMapper.toSuggestedTargets({
      targetCalories: 2600,
      targetProteinGrams: 140,
      targetCarbsGrams: 300,
      targetFatGrams: 72,
      rationale: '### Cách chia',
      source: 'ai',
      safetyNote: 'Tham khảo bác sĩ.',
    });
    expect(ai).toMatchObject({ targetCalories: 2600, source: 'ai' });

    const fallback = dietMapper.toSuggestedTargets({ source: 'something' });
    expect(fallback.source).toBe('formula');
  });
});
