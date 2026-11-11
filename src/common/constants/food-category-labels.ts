/**
 * Nhãn tiếng Việt cho nhóm món ăn.
 *
 * BE lưu `category` dạng tiếng Anh (canonical, không đổi để tránh phá dữ liệu cũ),
 * UI chỉ dịch khi hiển thị. Nhóm do người dùng tự nhập được giữ nguyên.
 */
export const FOOD_CATEGORY_LABELS: Record<string, string> = {
  Meat: 'Thịt',
  Grains: 'Ngũ cốc',
  Beverage: 'Đồ uống',
  Seafood: 'Hải sản',
  Eggs: 'Trứng',
  Legumes: 'Đậu & họ đậu',
  Dairy: 'Sữa & sản phẩm từ sữa',
  Vegetables: 'Rau củ',
  Fruits: 'Trái cây',
  Nuts: 'Hạt & hạt giống',
  Fats: 'Chất béo',
  Sweets: 'Đồ ngọt',
};

export function foodCategoryLabel(value: string | null | undefined): string {
  if (!value) return 'Chưa phân nhóm';
  return FOOD_CATEGORY_LABELS[value] ?? value;
}
