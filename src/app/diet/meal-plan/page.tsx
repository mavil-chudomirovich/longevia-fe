'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CitationChipList } from '@/components/shared/citation-chip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { WeekPicker } from '@/components/shared/week-picker';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { getBusinessTodayDateString, getBusinessWeekStart } from '@/lib/business-date';
import {
  useGenerateMealPlanMutation,
  useMealPlanQuery,
} from '@/features/diet/queries/diet.queries';
import { partitionWarnings } from '@/features/diet/utils/meal-plan-warnings';

export default function MealPlanPage() {
  const [weekStart, setWeekStart] = React.useState(() =>
    getBusinessWeekStart(getBusinessTodayDateString())
  );
  const [days, setDays] = React.useState(7);
  const [mealsPerDay, setMealsPerDay] = React.useState(4);
  const query = useMealPlanQuery(weekStart, true);
  const generate = useGenerateMealPlanMutation();
  const plan = query.data;
  const notFound = getApiErrorCode(query.error) === 'diet.meal_plan_not_found';
  const warnings = React.useMemo(
    () => partitionWarnings(plan?.warnings ?? [], plan?.days.map((day) => day.date) ?? []),
    [plan]
  );
  const error = plan ? null : notFound ? null : (query.error ?? generate.error);

  const onCreate = async () => {
    try {
      await generate.mutateAsync({ weekStartDate: weekStart, days, mealsPerDay });
    } catch {
      // Có thể server đã lưu xong dù client timeout; thử đọc lại bản đã lưu.
      const saved = await query.refetch();
      if (!saved.data) {
        // Trang hiển thị lỗi tại chỗ.
      }
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Kế hoạch ăn uống theo tuần</h1>
          <p className="mt-1 text-muted-foreground">
            Chọn tuần — Longevia tự lập kế hoạch cho thứ Hai đến Chủ nhật.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <WeekPicker
            id="meal-plan-week"
            value={weekStart}
            onChange={setWeekStart}
            disabled={generate.isPending}
          />
        </div>
      </div>

      <Tabs defaultValue="saved" className="mt-6">
        <TabsList>
          <TabsTrigger value="saved">Kế hoạch đã lưu</TabsTrigger>
          <TabsTrigger value="new">Tạo kế hoạch mới</TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kế hoạch của tuần đang chọn</CardTitle>
              <CardDescription>
                Tự động tải bản đã lưu, không gọi AI và không ghi đè.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button
                variant="outline"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                {query.isFetching ? 'Đang tải…' : 'Tải lại'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tạo kế hoạch mới</CardTitle>
              <CardDescription>
                AI sinh kế hoạch cho tuần đang chọn. Tuần đã có kế hoạch sẽ bị ghi đè khi bạn tạo
                mới.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2 sm:grid-cols-[120px_120px_auto] sm:items-end">
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
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void onCreate()} disabled={generate.isPending}>
                  {generate.isPending ? 'Đang tạo…' : 'Tạo kế hoạch'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {generate.isPending ? (
        <p className="py-8 text-muted-foreground">
          Đang lập kế hoạch bằng AI cho tuần đã chọn — có thể mất 30–90 giây…
        </p>
      ) : query.isLoading ? (
        <p className="py-8 text-muted-foreground">Đang tải kế hoạch…</p>
      ) : error ? (
        <Card className="mt-6">
          <CardContent className="space-y-3 py-6">
            <p role="alert">{getApiErrorMessage(error, 'Chưa tải được kế hoạch lúc này.')}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void query.refetch()}>
                Thử tải lại
              </Button>
              <Button onClick={() => void onCreate()} disabled={generate.isPending}>
                Tạo kế hoạch mới
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : plan ? (
        <div className="mt-6 space-y-4">
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
          Tuần này chưa có kế hoạch. Chuyển sang tab “Tạo kế hoạch mới” để lập kế hoạch.
        </p>
      )}
    </div>
  );
}
