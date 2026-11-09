'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-error';
import { CitationChipList } from '@/components/shared/citation-chip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { partitionWarnings } from '@/features/diet/utils/meal-plan-warnings';
import {
  useGenerateMealPlanMutation,
  useMealPlanQuery,
} from '@/features/diet/queries/diet.queries';

function nextMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const delta = day === 1 ? 0 : (8 - day) % 7;
  now.setUTCDate(now.getUTCDate() + delta);
  return now.toISOString().slice(0, 10);
}

export default function MealPlanPage() {
  const [weekStart, setWeekStart] = React.useState(nextMonday);
  const [days, setDays] = React.useState(7);
  const [mealsPerDay, setMealsPerDay] = React.useState(4);
  const [requested, setRequested] = React.useState(false);
  const query = useMealPlanQuery(weekStart, requested);
  const generate = useGenerateMealPlanMutation();
  const plan = query.data;
  const warnings = React.useMemo(
    () => partitionWarnings(plan?.warnings ?? [], plan?.days.map((day) => day.date) ?? []),
    [plan]
  );
  const error = query.error ?? generate.error;

  const onCreate = async () => {
    setRequested(true);
    try {
      await generate.mutateAsync({ weekStartDate: weekStart, days, mealsPerDay });
    } catch {
      // Trang hiển thị lỗi tại chỗ.
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Kế hoạch ăn uống theo tuần</h1>
          <p className="mt-1 text-muted-foreground">
            Kế hoạch được lưu lại để bạn mở lại bất cứ lúc nào.
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-[1fr_120px_120px_auto] sm:items-end">
          <div className="space-y-2">
            <label htmlFor="week-start" className="text-sm font-medium">
              Tuần bắt đầu (thứ Hai)
            </label>
            <Input
              id="week-start"
              type="date"
              value={weekStart}
              onChange={(event) => {
                setWeekStart(event.target.value);
                setRequested(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="days" className="text-sm font-medium">
              Số ngày
            </label>
            <Input
              id="days"
              type="number"
              min={1}
              max={7}
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="meals" className="text-sm font-medium">
              Bữa/ngày
            </label>
            <Input
              id="meals"
              type="number"
              min={1}
              max={4}
              value={mealsPerDay}
              onChange={(event) => setMealsPerDay(Number(event.target.value))}
            />
          </div>
          <Button onClick={() => void onCreate()} disabled={generate.isPending}>
            {generate.isPending ? 'Đang tạo…' : 'Tạo kế hoạch'}
          </Button>
        </CardContent>
      </Card>

      {generate.isPending || (requested && query.isLoading) ? (
        <p className="py-8 text-muted-foreground">Đang lập kế hoạch tuần…</p>
      ) : error ? (
        <Card className="mt-6">
          <CardContent className="space-y-3 py-6">
            <p role="alert">{getApiErrorMessage(error, 'Chưa tạo được kế hoạch lúc này.')}</p>
            <Button variant="outline" onClick={() => void onCreate()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : plan ? (
        <div className="mt-6 space-y-4">
          {plan.usedFallback && (
            <p className="rounded bg-amber-500/10 p-3 text-sm">
              Kế hoạch dùng phương án dự phòng do nguồn AI không sẵn sàng.
            </p>
          )}
          {warnings.global.map((warning) => (
            <p
              key={`${warning.code}-${warning.scope}`}
              className="rounded bg-amber-500/10 p-3 text-sm"
            >
              {warning.message}
            </p>
          ))}
          <p className="text-sm text-muted-foreground">{plan.disclaimer}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {plan.days.map((day) => {
              const dayWarnings = warnings.byDate[day.date] ?? [];

              return (
                <Card key={day.date}>
                  <CardHeader>
                    <CardTitle className="text-base">Ngày {day.date}</CardTitle>
                    <CardDescription>
                      {day.totalCalories} / {day.targetCalories} kcal · P{' '}
                      {Math.round(day.totalProteinGrams)}g
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dayWarnings.map((warning) => (
                      <p
                        key={`${warning.code}-${warning.scope}`}
                        className="rounded border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-200"
                      >
                        {warning.message}
                      </p>
                    ))}
                    {day.calorieCapReached ? (
                      <p className="text-sm">Đã chạm ngưỡng calo; chỉ còn gợi ý nhẹ.</p>
                    ) : (
                      day.meals.map((meal) => (
                        <div key={meal.mealType} className="rounded border p-3 text-sm">
                          <p className="font-medium">{meal.mealType}</p>
                          <MarkdownText
                            content={meal.rationale}
                            compact
                            className="text-muted-foreground"
                          />
                          <ul className="mt-2 list-disc pl-5">
                            {meal.foods.map((food) => (
                              <li key={food.foodId}>
                                {food.name} · {food.servingSize}
                                {food.servingUnit} · {food.calories} kcal
                              </li>
                            ))}
                          </ul>
                          <CitationChipList citations={meal.citations} className="mt-2" />
                        </div>
                      ))
                    )}
                    {day.suggestions.map((suggestion, index) => (
                      <div key={index} className="space-y-1.5 rounded bg-muted p-2">
                        <MarkdownText content={suggestion.text} compact />
                        <CitationChipList citations={suggestion.citations} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Chọn tuần rồi bấm “Tạo kế hoạch”. Nếu tuần đã có kế hoạch, hệ thống sẽ tải bản đã lưu.
        </p>
      )}
    </div>
  );
}
