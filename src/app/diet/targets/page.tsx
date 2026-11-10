'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getApiErrorAction, getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import type { ErrorAction } from '@/lib/error-messages';
import { InfoTooltip } from '@/components/shared/info-tooltip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { targetSchema, type TargetFormValues } from '@/features/diet/schemas/diet.schema';
import type { SuggestedTargetsModel } from '@/features/diet/types/diet.model';
import {
  useSaveTargetMutation,
  useSuggestTargetsMutation,
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
const hints = {
  targetCalories: 'Tổng năng lượng bạn muốn ăn mỗi ngày.',
  targetProteinGrams: 'Đạm giúp giữ và xây cơ; 1 g protein ≈ 4 kcal.',
  targetCarbsGrams: 'Tinh bột là nguồn năng lượng chính; 1 g carb ≈ 4 kcal.',
  targetFatGrams: 'Chất béo cần cho hormone và hấp thu vitamin; 1 g chất béo ≈ 9 kcal.',
};

export default function TargetsPage() {
  const query = useTargetQuery();
  const save = useSaveTargetMutation();
  const suggest = useSuggestTargetsMutation();
  const [goal, setGoal] = React.useState('Maintain');
  const [description, setDescription] = React.useState('');
  const [suggestion, setSuggestion] = React.useState<SuggestedTargetsModel | null>(null);
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

  const onSuggest = async () => {
    setFormError('');
    setFormAction(undefined);
    try {
      const { data: result } = await suggest.mutateAsync({ description, goal });
      setSuggestion(result);
      form.reset({
        targetCalories: String(result.targetCalories),
        targetProteinGrams: String(result.targetProteinGrams),
        targetCarbsGrams: String(result.targetCarbsGrams),
        targetFatGrams: String(result.targetFatGrams),
      });
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          'Chưa gợi ý được mục tiêu. Bạn kiểm tra hồ sơ/cân nặng rồi thử lại nhé.'
        )
      );
    }
  };

  const submit = () =>
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
        await save.mutateAsync(values);
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
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Chỉ số dưới đây là mục tiêu mỗi ngày; bạn có thể để Longevia tính giúp hoặc tự nhập.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] lg:items-start">
        <Card className="order-2 lg:order-1">
          <CardHeader>
            <CardTitle className="text-base">Gợi ý bằng AI</CardTitle>
            <CardDescription>
              Mô tả mục tiêu hiện tại của bạn; Longevia sẽ đề xuất calo và macro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="suggest-description">Mô tả mong muốn</Label>
                <Textarea
                  id="suggest-description"
                  value={description}
                  maxLength={500}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ví dụ: mình 32 tuổi, tập gym 3 buổi/tuần, muốn giảm mỡ bụng nhưng vẫn đủ sức tập."
                  className="min-h-20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suggest-goal">Mục tiêu</Label>
                <select
                  id="suggest-goal"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                >
                  <option value="LoseWeight">Giảm cân</option>
                  <option value="Maintain">Duy trì</option>
                  <option value="BuildMuscle">Tăng cơ</option>
                  <option value="Longevity">Trường thọ</option>
                </select>
              </div>
            </div>
            <Button
              onClick={() => void onSuggest()}
              disabled={suggest.isPending}
              variant="outline"
              className="gap-1.5"
            >
              {suggest.isPending ? 'Đang gợi ý…' : 'Gợi ý bằng AI'}
            </Button>

            {suggestion && (
              <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                    {suggestion.source === 'ai' ? 'AI đề xuất' : 'Công thức chuẩn'}
                  </span>
                  <span>Chưa lưu — kiểm tra rồi bấm “Lưu mục tiêu”.</span>
                </div>
                <MarkdownText content={suggestion.rationale} compact />
                <p className="text-xs text-muted-foreground">{suggestion.safetyNote}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="order-1 lg:order-2">
          <CardHeader>
            <CardTitle>Mục tiêu dinh dưỡng</CardTitle>
            <CardDescription>
              Mục tiêu calo và macro bạn muốn duy trì mỗi ngày. Bạn có thể dùng Gợi ý bằng AI hoặc
              tự nhập, rồi bấm “Lưu mục tiêu”.
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
                      Dùng <strong>Gợi ý bằng AI</strong> để Longevia đề xuất dựa trên hồ sơ và cân
                      nặng gần nhất, hoặc tự nhập các con số bên dưới rồi bấm{' '}
                      <strong>Lưu mục tiêu</strong>.
                    </p>
                  </div>
                )}
                {query.data && (
                  <div className="mb-5 rounded-lg bg-muted/60 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <p className="flex items-center gap-1.5">
                        BMR:
                        <InfoTooltip
                          label="BMR là gì?"
                          content="BMR (Basal Metabolic Rate) là năng lượng cơ thể dùng khi nghỉ hoàn toàn — chỉ để duy trì tim đập, hô hấp, nhiệt độ."
                        />
                        <strong>
                          {query.data.bmr === null ? 'Chưa có dữ liệu' : `${query.data.bmr} kcal`}
                        </strong>
                      </p>
                      <p className="flex items-center gap-1.5">
                        TDEE:
                        <InfoTooltip
                          label="TDEE là gì?"
                          content="TDEE (Total Daily Energy Expenditure) là tổng năng lượng bạn tiêu hao mỗi ngày, gồm BMR cộng vận động và tiêu hóa."
                        />
                        <strong>
                          {query.data.tdee === null ? 'Chưa có dữ liệu' : `${query.data.tdee} kcal`}
                        </strong>
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Tính từ hồ sơ và cân nặng gần nhất khi bạn lưu mục tiêu.
                    </p>
                  </div>
                )}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit()(event);
                  }}
                  className="space-y-4"
                  noValidate
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map((field) => (
                      <div key={field} className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor={field}>{labels[field]}</Label>
                          <InfoTooltip label={hints[field]} content={hints[field]} />
                        </div>
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
                    <Button type="submit" disabled={save.isPending}>
                      {save.isPending ? 'Đang lưu…' : 'Lưu mục tiêu'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
