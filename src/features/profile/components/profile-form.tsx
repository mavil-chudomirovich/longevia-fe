'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ProfileModel } from '@/features/auth/types/auth.model';
import { getBusinessTodayDateString } from '@/lib/business-date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { profileSchema, type ProfileFormValues } from '../schemas/profile.schema';
import { useUpdateProfileMutation } from '../queries/profile.queries';
import { getApiErrorFields, toastFriendlyError } from '@/lib/api-error';

const emptyProfile: ProfileFormValues = {
  birthDate: '',
  biologicalSex: 'Female',
  heightCm: '',
  activityLevel: 'Sedentary',
  dietaryPreference: 'None',
  allergies: [],
};

export function ProfileForm({
  initialProfile,
  onSaved,
}: {
  initialProfile?: ProfileModel | null;
  onSaved?: () => void;
}) {
  const mutation = useUpdateProfileMutation();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: emptyProfile,
  });
  const [allergyText, setAllergyText] = React.useState('');

  React.useEffect(() => {
    if (!initialProfile) return;
    form.reset({
      birthDate: initialProfile.birthDate,
      biologicalSex: initialProfile.biologicalSex as ProfileFormValues['biologicalSex'],
      heightCm: String(initialProfile.heightCm),
      activityLevel: initialProfile.activityLevel as ProfileFormValues['activityLevel'],
      dietaryPreference: initialProfile.dietaryPreference as ProfileFormValues['dietaryPreference'],
      allergies: initialProfile.allergies,
    });
  }, [form, initialProfile]);

  const addAllergy = () => {
    const value = allergyText.trim();
    const current = form.getValues('allergies');
    if (
      value &&
      !current.some((item) => item.toLowerCase() === value.toLowerCase()) &&
      current.length < 32
    ) {
      form.setValue('allergies', [...current, value], { shouldValidate: true });
    }
    setAllergyText('');
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      onSaved?.();
    } catch (error) {
      // Gắn lỗi vào đúng ô nếu BE trả lỗi theo trường, đồng thời báo bằng lời dễ hiểu.
      const fields = getApiErrorFields(error);
      if (fields) {
        for (const [key, messages] of Object.entries(fields)) {
          const field = (key.charAt(0).toLowerCase() + key.slice(1)) as keyof ProfileFormValues;
          if (field in form.getValues()) form.setError(field, { message: messages[0] });
        }
      }
      toastFriendlyError(error, 'Chưa lưu được hồ sơ. Bạn kiểm tra lại thông tin rồi thử lại nhé.');
    }
  });

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="birthDate">Ngày sinh</Label>
          <Input
            id="birthDate"
            type="date"
            max={getBusinessTodayDateString()}
            {...form.register('birthDate')}
          />
          {form.formState.errors.birthDate && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.birthDate.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="biologicalSex">Giới tính sinh học</Label>
          <select
            id="biologicalSex"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            {...form.register('biologicalSex')}
          >
            <option value="Female">Nữ</option>
            <option value="Male">Nam</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="heightCm">Chiều cao (cm)</Label>
          <Input
            id="heightCm"
            type="number"
            min="50"
            max="250"
            step="0.01"
            inputMode="decimal"
            {...form.register('heightCm')}
          />
          {form.formState.errors.heightCm && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.heightCm.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="activityLevel">Mức vận động</Label>
          <select
            id="activityLevel"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            {...form.register('activityLevel')}
          >
            <option value="Sedentary">Ít vận động</option>
            <option value="LightlyActive">Vận động nhẹ</option>
            <option value="ModeratelyActive">Vận động vừa</option>
            <option value="VeryActive">Vận động nhiều</option>
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="dietaryPreference">Chế độ ăn</Label>
          <select
            id="dietaryPreference"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            {...form.register('dietaryPreference')}
          >
            <option value="None">Không có yêu cầu riêng</option>
            <option value="Keto">Keto</option>
            <option value="Vegan">Thuần chay</option>
            <option value="Mediterranean">Địa Trung Hải</option>
            <option value="LowCarb">Ít tinh bột</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="allergyText">Dị ứng hoặc thực phẩm cần tránh</Label>
        <div className="flex gap-2">
          <Input
            id="allergyText"
            value={allergyText}
            maxLength={100}
            onChange={(event) => setAllergyText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addAllergy();
              }
            }}
            placeholder="Nhập rồi nhấn Enter"
          />
          <Button type="button" variant="outline" onClick={addAllergy}>
            Thêm
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.watch('allergies').map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {item}
              <button
                type="button"
                aria-label={`Xóa ${item}`}
                onClick={() =>
                  form.setValue(
                    'allergies',
                    form.getValues('allergies').filter((_, itemIndex) => itemIndex !== index)
                  )
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {form.formState.errors.allergies && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.allergies.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Đang lưu...' : 'Lưu hồ sơ sức khỏe'}
      </Button>
    </form>
  );
}
