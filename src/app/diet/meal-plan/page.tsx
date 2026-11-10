'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CitationChipList } from '@/components/shared/citation-chip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { WeekPicker } from '@/components/shared/week-picker';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import {
  formatBusinessWeekRange,
  getBusinessTodayDateString,
  getBusinessWeekStart,
} from '@/lib/business-date';
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
  const [createOpen, setCreateOpen] = React.useState(false);
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
      return true;
    } catch {
      // Có thể server đã lưu xong dù client timeout; thử đọc lại bản đã lưu.
      await query.refetch();
      return false;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold">Kế hoạch ăn uống theo tuần</h1>
        <p className="mt-1 text-muted-foreground">
          Chọn tuần và tham số ở cột bên trái — kế hoạch hiển thị ngay bên cạnh.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <Card className="lg:sticky lg:top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thiết lập kế hoạch</CardTitle>
            <CardDescription className="text-xs">
              {formatBusinessWeekRange(weekStart)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="meal-plan-week" className="text-sm font-medium">
                Tuần
              </label>
              <WeekPicker
                id="meal-plan-week"
                value={weekStart}
                onChange={setWeekStart}
                disabled={generate.isPending}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {plan
                ? 'Tuần này đã có kế hoạch. Tải lại hoặc tạo lại nếu bạn muốn thay đổi.'
                : 'Tuần này chưa có kế hoạch. Tạo mới để AI lập thực đơn.'}
            </p>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => setCreateOpen(true)}
                disabled={generate.isPending}
              >
                Tạo kế hoạch
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                {query.isFetching ? 'Đang tải…' : 'Tải lại'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b pb-3">
            <div>
              <p className="text-sm font-medium">{formatBusinessWeekRange(weekStart)}</p>
              <p className="text-xs text-muted-foreground">
                {plan
                  ? `${plan.days.length} ngày · ${plan.mealsPerDay} bữa/ngày`
                  : 'Chưa có kế hoạch cho tuần này'}
              </p>
            </div>
            {plan && (
              <p className="text-xs text-muted-foreground">
                Mục tiêu tuần {plan.weeklyTargetCalories} kcal
              </p>
            )}
          </div>

          {generate.isPending ? (
            <p className="py-8 text-muted-foreground">
              Đang lập kế hoạch bằng AI cho tuần đã chọn — có thể mất 30–90 giây…
            </p>
          ) : query.isLoading ? (
            <p className="py-8 text-muted-foreground">Đang tải kế hoạch…</p>
          ) : error ? (
            <Card>
              <CardContent className="space-y-3 py-6">
                <p role="alert">{getApiErrorMessage(error, 'Chưa tải được kế hoạch lúc này.')}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void query.refetch()}>
                    Thử tải lại
                  </Button>
                  <Button onClick={() => setCreateOpen(true)} disabled={generate.isPending}>
                    Tạo kế hoạch mới
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : plan ? (
            <>
              {warnings.global.map((warning) => (
                <p
                  key={`${warning.code}-${warning.scope}`}
                  className="rounded bg-amber-500/10 p-3 text-sm"
                >
                  {warning.message}
                </p>
              ))}
              <p className="text-sm text-muted-foreground">{plan.disclaimer}</p>
              <div className="grid gap-4 xl:grid-cols-2">
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
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tuần này chưa có kế hoạch. Bấm “Tạo kế hoạch” ở cột bên trái để lập kế hoạch.
            </p>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo kế hoạch tuần</DialogTitle>
            <DialogDescription>{formatBusinessWeekRange(weekStart)}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="dialog-days" className="text-sm font-medium">
                Số ngày
              </label>
              <Input
                id="dialog-days"
                type="number"
                min={1}
                max={7}
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="dialog-meals" className="text-sm font-medium">
                Bữa/ngày
              </label>
              <Input
                id="dialog-meals"
                type="number"
                min={1}
                max={4}
                value={mealsPerDay}
                onChange={(event) => setMealsPerDay(Number(event.target.value))}
              />
            </div>
          </div>

          {plan && (
            <p className="text-xs text-muted-foreground">
              Tuần này đã có kế hoạch; tạo mới sẽ ghi đè bản đã lưu.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Huỷ
            </Button>
            <Button
              disabled={generate.isPending}
              onClick={async () => {
                const ok = await onCreate();
                if (ok) {
                  setCreateOpen(false);
                }
              }}
            >
              {generate.isPending ? 'Đang tạo…' : 'Tạo kế hoạch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
