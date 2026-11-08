'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiErrorAction, getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import type { ErrorAction } from '@/lib/error-messages';
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
  const [formAction, setFormAction] = React.useState<ErrorAction | undefined>();
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
      setFormAction(undefined);
      const calories = Number(values.targetCalories);
      const fromMacros =
        Number(values.targetProteinGrams) * 4 +
        Number(values.targetCarbsGrams) * 4 +
        Number(values.targetFatGrams) * 9;
      if (Math.abs(fromMacros - calories) > calories * 0.05) {
        setFormError(
          `Tổng năng lượng từ protein, carb và chất béo (≈ ${Math.round(fromMacros)} kcal) đang chênh khá nhiều so với calo mục tiêu. Bạn điều chỉnh để hai con số gần nhau hơn nhé (lệch không quá 5%).`
        );
        return;
      }
      try {
        if (mode === 'manual') await save.mutateAsync(values);
        else await calculate.mutateAsync(values);
        // Không gọi query.refetch() ở đây: mutation đã invalidate query mục tiêu, gọi thêm
        // sẽ huỷ request đang chạy (và trước đây sinh toast "mất kết nối" giả).
      } catch (error) {
        setFormError(
          getApiErrorMessage(
            error,
            'Chưa lưu được mục tiêu. Bạn kiểm tra lại thông tin rồi thử lại nhé.'
          )
        );
        setFormAction(getApiErrorAction(error));
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
            Tự nhập mục tiêu, hoặc để Longevia tính từ hồ sơ và cân nặng gần nhất. BMR là năng lượng
            cơ thể cần khi nghỉ ngơi; TDEE là tổng năng lượng bạn tiêu hao mỗi ngày.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p>Đang tải mục tiêu…</p>
          ) : query.isError && !missing ? (
            <div className="space-y-3">
              <p role="alert">
                {getApiErrorMessage(
                  query.error,
                  'Chưa tải được mục tiêu của bạn. Bạn thử lại giúp mình nhé.'
                )}
              </p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                Thử lại
              </Button>
            </div>
          ) : (
            <>
              {missing && (
                <div className="mb-5 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                  <p className="font-medium">Bạn chưa có mục tiêu dinh dưỡng.</p>
                  <p className="mt-1 text-muted-foreground">
                    Bấm <strong>Tính tự động</strong> để Longevia đề xuất dựa trên hồ sơ và cân nặng
                    gần nhất của bạn, hoặc tự nhập các con số bên dưới rồi bấm{' '}
                    <strong>Lưu thủ công</strong>.
                  </p>
                </div>
              )}
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
                    {formAction && (
                      <Link href={formAction.href} className="ml-1 font-medium underline">
                        {formAction.label}
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
