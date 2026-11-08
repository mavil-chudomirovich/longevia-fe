'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorCode } from '@/lib/api-error';
import { targetSchema, type TargetFormValues } from '@/features/diet/schemas/diet.schema';
import {
  useCalculateTargetMutation,
  useSaveTargetMutation,
  useTargetQuery,
} from '@/features/diet/queries/diet.queries';

const defaults: TargetFormValues = {
  targetCalories: '',
  targetProteinGrams: '',
  targetCarbsGrams: '',
  targetFatGrams: '',
};
const fields = [
  'targetCalories',
  'targetProteinGrams',
  'targetCarbsGrams',
  'targetFatGrams',
] as const;
const labels = {
  targetCalories: 'Calo mục tiêu (kcal)',
  targetProteinGrams: 'Protein (g)',
  targetCarbsGrams: 'Carbohydrate (g)',
  targetFatGrams: 'Chất béo (g)',
};

export default function TargetsPage() {
  const query = useTargetQuery();
  const save = useSaveTargetMutation();
  const calculate = useCalculateTargetMutation();
  const form = useForm<TargetFormValues>({
    resolver: zodResolver(targetSchema),
    defaultValues: defaults,
  });
  const [formError, setFormError] = React.useState('');
  const code = getApiErrorCode(query.error);
  const missing = code === 'diet.target_not_found';

  React.useEffect(() => {
    if (!query.data) return;
    form.reset({
      targetCalories: String(query.data.targetCalories),
      targetProteinGrams: String(query.data.targetProteinGrams),
      targetCarbsGrams: String(query.data.targetCarbsGrams),
      targetFatGrams: String(query.data.targetFatGrams),
    });
  }, [form, query.data]);

  const submit = (mode: 'manual' | 'calculate') =>
    form.handleSubmit(async (values) => {
      setFormError('');
      const calories = Number(values.targetCalories);
      const fromMacros =
        Number(values.targetProteinGrams) * 4 +
        Number(values.targetCarbsGrams) * 4 +
        Number(values.targetFatGrams) * 9;
      if (Math.abs(fromMacros - calories) > calories * 0.05) {
        setFormError('Năng lượng từ macro cần lệch tối đa 5% so với mục tiêu calo.');
        return;
      }
      try {
        if (mode === 'manual') await save.mutateAsync(values);
        else await calculate.mutateAsync(values);
        await query.refetch();
      } catch (error) {
        const reason = getApiErrorCode(error);
        if (reason === 'diet.profile_not_found' || reason === 'diet.profile_incomplete')
          setFormError('Cần hoàn thiện hồ sơ trước khi tính tự động.');
        else if (reason === 'diet.weight_not_found')
          setFormError('Hãy ghi nhận cân nặng trước khi tính mục tiêu.');
        else setFormError('Không thể lưu mục tiêu. Vui lòng kiểm tra thông tin và thử lại.');
      }
    });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/diet">Về nhật ký</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Mục tiêu dinh dưỡng</CardTitle>
          <CardDescription>
            Nhập mục tiêu thủ công hoặc tính BMR/TDEE từ hồ sơ và cân nặng mới nhất.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p>Đang tải mục tiêu…</p>
          ) : query.isError && !missing ? (
            <div>
              <p role="alert">Không thể tải mục tiêu.</p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : (
            <>
              {query.data && (
                <div className="mb-5 grid gap-3 rounded-lg bg-muted/60 p-4 sm:grid-cols-2">
                  <p>
                    BMR:{' '}
                    <strong>
                      {query.data.bmr === null ? 'Chưa tính' : `${query.data.bmr} kcal`}
                    </strong>
                  </p>
                  <p>
                    TDEE:{' '}
                    <strong>
                      {query.data.tdee === null ? 'Chưa tính' : `${query.data.tdee} kcal`}
                    </strong>
                  </p>
                </div>
              )}
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit('manual')(event);
                }}
                className="space-y-4"
                noValidate
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map((field) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field}>{labels[field]}</Label>
                      <Input
                        id={field}
                        type="number"
                        min="0"
                        step="0.001"
                        {...form.register(field)}
                      />
                      {form.formState.errors[field] && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors[field]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {formError && (
                  <div
                    role="alert"
                    className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    {formError}
                    {formError.includes('hồ sơ') && (
                      <Link href="/profile" className="ml-1 underline">
                        Cập nhật hồ sơ
                      </Link>
                    )}
                    {formError.includes('cân nặng') && (
                      <Link href="/progress/metrics" className="ml-1 underline">
                        Ghi cân nặng
                      </Link>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={save.isPending || calculate.isPending}>
                    {save.isPending ? 'Đang lưu…' : 'Lưu thủ công'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={save.isPending || calculate.isPending}
                    onClick={() => void submit('calculate')()}
                  >
                    {calculate.isPending ? 'Đang tính…' : 'Tính tự động'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
