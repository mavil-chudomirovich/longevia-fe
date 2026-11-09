'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CitationChipList } from '@/components/shared/citation-chip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { getApiErrorMessage } from '@/lib/api-error';
import { describeAiFallback } from '@/lib/ai-fallback';
import {
  useGenerateMealPlanMutation,
  useMealPlanQuery,
} from '@/features/diet/queries/diet.queries';
import { partitionWarnings } from '@/features/diet/utils/meal-plan-warnings';

/** Ngày local YYYY-MM-DD, tránh lệch ngày do toISOString (UTC). */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function today(): string {
  return toLocalDateString(new Date());
}

/** Chọn một ngày bất kỳ, trả về thứ Hai của tuần chứa ngày đó. */
function mondayOf(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return toLocalDateString(date);
}

function formatWeek(weekStart: string): string {
  if (!weekStart) return '';
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' });
  return `Tuần ${fmt.format(start)} – ${fmt.format(end)}/${end.getFullYear()}`;
}

export default function MealPlanPage() {
  const [selectedDate, setSelectedDate] = React.useState<string>(today);
  const [days, setDays] = React.useState(7);
  const [mealsPerDay, setMealsPerDay] = React.useState(4);
  const [loaded, setLoaded] = React.useState(false);
  const weekStart = mondayOf(selectedDate);
  const query = useMealPlanQuery(weekStart, loaded);
  const generate = useGenerateMealPlanMutation();
  const plan = query.data;
  const warnings = React.useMemo(
    () => partitionWarnings(plan?.warnings ?? [], plan?.days.map((day) => day.date) ?? []),
    [plan]
  );
  const error = query.error ?? generate.error;
  const fallbackInfo = plan ? describeAiFallback(plan.usedFallbackReason) : null;

  const loadSaved = () => {
    setLoaded(true);
    void query.refetch();
  };

  const onCreate = async () => {
    setLoaded(true);
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
            Chọn ngày bất kỳ trong tuần — Longevia tự xác định tuần bắt đầu từ thứ Hai.
          </p>
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
              <CardTitle className="text-base">Mở kế hoạch đã lưu</CardTitle>
              <CardDescription>
                Chỉ đọc bản đã lưu của tuần, không gọi AI và không ghi đè.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <label htmlFor="saved-date" className="text-sm font-medium">
                  Chọn một ngày trong tuần
                </label>
                <Input
                  id="saved-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setLoaded(false);
                  }}
                />
                {weekStart && (
                  <p className="text-xs text-muted-foreground">{formatWeek(weekStart)}</p>
                )}
              </div>
              <Button
                onClick={loadSaved}
                disabled={!weekStart || query.isFetching}
                variant="outline"
              >
                {query.isFetching && loaded ? 'Đang tải…' : 'Tải kế hoạch'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tạo kế hoạch mới</CardTitle>
              <CardDescription>
                AI sinh kế hoạch theo từng ngày. Tuần đã có kế hoạch sẽ bị ghi đè khi bạn tạo mới.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-2 sm:grid-cols-[1fr_100px_100px_auto] sm:items-end">
              <div className="space-y-2">
                <label htmlFor="new-date" className="text-sm font-medium">
                  Chọn một ngày trong tuần
                </label>
                <Input
                  id="new-date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setLoaded(false);
                  }}
                />
                {weekStart && (
                  <p className="text-xs text-muted-foreground">{formatWeek(weekStart)}</p>
                )}
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
              <Button onClick={() => void onCreate()} disabled={!weekStart || generate.isPending}>
                {generate.isPending ? 'Đang tạo…' : 'Tạo kế hoạch'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {generate.isPending ? (
        <p className="py-8 text-muted-foreground">
          Đang lập kế hoạch tuần theo từng ngày — có thể mất 30–60 giây…
        </p>
      ) : loaded && query.isLoading ? (
        <p className="py-8 text-muted-foreground">Đang tải kế hoạch…</p>
      ) : loaded && error ? (
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
      ) : loaded && plan ? (
        <div className="mt-6 space-y-4">
          {plan.usedFallback && fallbackInfo && (
            <div className="space-y-2 rounded border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-sm">{fallbackInfo.message}</p>
              {fallbackInfo.retryable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void onCreate()}
                  disabled={generate.isPending}
                >
                  Thử tạo lại
                </Button>
              )}
            </div>
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
          Chọn tab phù hợp: mở bản đã lưu hoặc tạo kế hoạch mới.
        </p>
      )}
    </div>
  );
}
