import { z } from 'zod';

function isAtLeast13(birthDate: string): boolean {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const today = new Date();
  const limit = new Date(
    Date.UTC(today.getUTCFullYear() - 13, today.getUTCMonth(), today.getUTCDate())
  );
  return Number.isFinite(birth.getTime()) && birth <= limit;
}

export const profileSchema = z.object({
  birthDate: z.string().refine(isAtLeast13, 'Bạn phải từ đủ 13 tuổi trở lên.'),
  biologicalSex: z.enum(['Male', 'Female'], { message: 'Vui lòng chọn giới tính sinh học.' }),
  heightCm: z
    .string()
    .refine(
      (value) => value.trim() !== '' && Number.isFinite(Number(value)),
      'Nhập chiều cao hợp lệ.'
    )
    .refine(
      (value) => Number(value) >= 50 && Number(value) <= 250,
      'Chiều cao phải từ 50 đến 250 cm.'
    )
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), 'Chiều cao tối đa 2 chữ số thập phân.'),
  activityLevel: z.enum(['Sedentary', 'LightlyActive', 'ModeratelyActive', 'VeryActive'], {
    message: 'Vui lòng chọn mức vận động.',
  }),
  dietaryPreference: z.enum(['None', 'Keto', 'Vegan', 'Mediterranean', 'LowCarb'], {
    message: 'Vui lòng chọn chế độ ăn.',
  }),
  allergies: z.array(z.string().trim().min(1)).max(32, 'Tối đa 32 mục dị ứng.'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
