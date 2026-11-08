import { z } from 'zod';

const decimal = z
  .string()
  .trim()
  .refine(
    (value) =>
      value !== '' &&
      Number.isFinite(Number(value)) &&
      Number(value) >= 0 &&
      Number(value) <= 1_000_000,
    'Nhập số từ 0 đến 1.000.000.'
  )
  .refine((value) => /^\d+(\.\d{1,3})?$/.test(value), 'Tối đa 3 chữ số thập phân.');

export const createFoodSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên món.').max(200),
  category: z.string().trim().min(1, 'Nhập nhóm món.').max(50),
  servingSize: decimal.refine((value) => Number(value) > 0, 'Khẩu phần phải lớn hơn 0.'),
  servingUnit: z.string().trim().min(1, 'Nhập đơn vị khẩu phần.').max(30),
  calories: decimal,
  proteinGrams: decimal,
  carbsGrams: decimal,
  fatGrams: decimal,
  fiberGrams: decimal,
  allergens: z.array(z.string().trim().min(1)).max(32),
});

export const targetSchema = z.object({
  targetCalories: decimal.refine((value) => Number(value) > 0, 'Mục tiêu calo phải lớn hơn 0.'),
  targetProteinGrams: decimal,
  targetCarbsGrams: decimal,
  targetFatGrams: decimal,
});
export type CreateFoodValues = z.infer<typeof createFoodSchema>;
export type TargetFormValues = z.infer<typeof targetSchema>;
