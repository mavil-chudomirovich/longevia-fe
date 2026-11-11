/**
 * Nhãn tiếng Việt cho loại bữa ăn.
 * Dùng chung cho nhật ký, hôm nay, kế hoạch tuần và dialog ghi bữa.
 */
export const MEAL_TYPE_LABELS: Record<string, string> = {
  Breakfast: 'Bữa sáng',
  Lunch: 'Bữa trưa',
  Dinner: 'Bữa tối',
  Snack: 'Bữa phụ',
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  DINNER: 'Bữa tối',
  SNACK: 'Bữa phụ',
};

export function mealTypeLabel(value: string | null | undefined): string {
  if (!value) return 'Bữa ăn';
  return MEAL_TYPE_LABELS[value] ?? value;
}
