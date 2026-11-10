'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Activity,
  Apple,
  BedDouble,
  Droplets,
  Flame,
  HeartPulse,
  Sparkles,
  Timer,
  Utensils,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogMealDialog } from '@/features/diet/components/log-meal-dialog';
import { getApiErrorCode } from '@/lib/api-error';
import { getBusinessTodayDateString, getBusinessWeekStart } from '@/lib/business-date';
import { cn } from '@/lib/utils';
import { useDailySummaryQuery, useMealPlanQuery } from '@/features/diet/queries/diet.queries';
import {
  useLogWaterMutation,
  useWaterTodayQuery,
  useCurrentFastingQuery,
  useSleepTodayQuery,
  useDashboardSummaryQuery,
} from '@/features/progress/queries/progress.queries';
import {
  useLongevityQuery,
  useWorkoutPlanQuery,
} from '@/features/progress/queries/progress-ai.queries';
import {
  formatDisplayDateTime,
  formatDurationHours,
} from '@/features/progress/utils/progress-date';

const MEAL_LABELS: Record<string, string> = {
  Breakfast: 'Bữa sáng',
  Lunch: 'Bữa trưa',
  Dinner: 'Bữa tối',
  Snack: 'Bữa phụ',
  BREAKFAST: 'Bữa sáng',
  LUNCH: 'Bữa trưa',
  DINNER: 'Bữa tối',
  SNACK: 'Bữa phụ',
};

function mealLabel(value: string): string {
  return MEAL_LABELS[value] ?? value;
}

function todayTitle(): string {
  const formatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
}

export default function TodayPage() {
  const today = getBusinessTodayDateString();
  const weekStart = getBusinessWeekStart(today);
  const [mealOpen, setMealOpen] = React.useState(false);
  const summary = useDailySummaryQuery(today);
  const water = useWaterTodayQuery();
  const fasting = useCurrentFastingQuery();
  const sleep = useSleepTodayQuery();
  const dashboard = useDashboardSummaryQuery();
  const mealPlan = useMealPlanQuery(weekStart, true);
  const workoutPlan = useWorkoutPlanQuery(weekStart, true);
  const longevity = useLongevityQuery(7);
  const logWater = useLogWaterMutation();

  const noMealPlan = getApiErrorCode(mealPlan.error) === 'diet.meal_plan_not_found';
  const noWorkoutPlan = getApiErrorCode(workoutPlan.error) === 'progress.workout_plan_not_found';
  const planDay = mealPlan.data?.days.find((day) => day.date === today);
  const workoutDay = workoutPlan.data?.days.find((day) => day.date === today);
  const calories = summary.data?.consumedCalories ?? 0;
  const targetCalories = summary.data?.targetCalories ?? 0;
  const caloriePercent = targetCalories > 0 ? Math.min(100, (calories / targetCalories) * 100) : 0;
  const waterPercent =
    water.data && water.data.targetMl > 0
      ? Math.min(100, (water.data.consumedMl / water.data.targetMl) * 100)
      : 0;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Hôm nay</p>
          <h1 className="text-3xl font-bold">{todayTitle()}</h1>
          <p className="mt-1 text-muted-foreground">
            Mọi thứ bạn cần cho một ngày: ăn uống, vận động, phục hồi và thói quen.
          </p>
        </div>
        <Button onClick={() => setMealOpen(true)} className="gap-1.5">
          <Utensils className="size-4" aria-hidden="true" />
          Ghi bữa ăn
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Flame className="size-4" />}
          label="Calo hôm nay"
          value={`${Math.round(calories)} / ${Math.round(targetCalories)} kcal`}
          detail={
            targetCalories > 0
              ? calories > targetCalories
                ? `Vượt ${Math.round(calories - targetCalories)} kcal`
                : `Còn ${Math.round(targetCalories - calories)} kcal`
              : 'Chưa có mục tiêu'
          }
          progress={caloriePercent}
        />
        <SummaryCard
          icon={<Droplets className="size-4" />}
          label="Nước uống"
          value={`${water.data?.consumedMl ?? 0} / ${water.data?.targetMl ?? 2500} ml`}
          detail={`${Math.round(waterPercent)}% mục tiêu ngày`}
          progress={waterPercent}
          tone="blue"
        />
        <SummaryCard
          icon={<Timer className="size-4" />}
          label="Nhịn ăn"
          value={
            fasting.data
              ? `${formatDurationHours(fasting.data.elapsedHours)} / ${fasting.data.targetHours} giờ`
              : 'Chưa có phiên'
          }
          detail={
            fasting.data
              ? `Còn ${formatDurationHours(fasting.data.remainingHours)}`
              : 'Bắt đầu phiên mới'
          }
          progress={fasting.data?.visualPercent ?? 0}
          tone="amber"
        />
        <SummaryCard
          icon={<BedDouble className="size-4" />}
          label="Giấc ngủ đêm qua"
          value={sleep.data ? formatDurationHours(sleep.data.durationHours) : 'Chưa ghi'}
          detail={sleep.data ? sleep.data.sleepQualityLabel : 'Ghi lại giấc ngủ'}
          progress={sleep.data ? Math.min(100, (sleep.data.durationHours / 8) * 100) : 0}
          tone="indigo"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Apple className="size-4 text-emerald-600" aria-hidden="true" />
              Ăn uống hôm nay
            </CardTitle>
            <CardDescription>Đã ăn gì và kế hoạch bữa hôm nay.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải nhật ký ăn uống…</p>
            ) : summary.isError ? (
              <p className="text-sm text-muted-foreground">
                Chưa tải được nhật ký. Bạn cần thiết lập mục tiêu dinh dưỡng trước.
              </p>
            ) : summary.data && summary.data.meals.length > 0 ? (
              <ul className="space-y-3">
                {summary.data.meals.map((meal) => (
                  <li key={meal.mealType} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">
                        {mealLabel(meal.mealType)}
                      </span>
                      <span className="font-medium text-foreground">
                        {Math.round(meal.totalCalories)} kcal
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-xs text-muted-foreground">
                      {meal.items.map((item) => (
                        <li key={`${meal.mealType}-${item.foodId}`}>
                          {item.name} · {item.quantity}
                          {item.servingUnit} · {Math.round(item.calories)} kcal
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Hôm nay chưa ghi bữa ăn nào.</p>
            )}

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium">Kế hoạch bữa hôm nay</p>
              {planDay && planDay.meals.length > 0 ? (
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                  {planDay.meals.map((meal) => (
                    <li key={meal.mealType}>
                      <span className="font-medium text-foreground">
                        {mealLabel(meal.mealType)}:
                      </span>{' '}
                      {meal.foods.map((food) => food.name).join(', ')}
                    </li>
                  ))}
                </ul>
              ) : noMealPlan ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Tuần này chưa có kế hoạch.{' '}
                  <Link href="/diet/meal-plan" className="font-medium text-primary underline">
                    Tạo kế hoạch
                  </Link>
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Hôm nay là ngày nghỉ hoặc chưa có bữa.
                </p>
              )}
            </div>

            <Button variant="outline" className="w-full" onClick={() => setMealOpen(true)}>
              Ghi bữa ăn
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-4 text-blue-600" aria-hidden="true" />
                Vận động hôm nay
              </CardTitle>
              <CardDescription>Bài tập theo kế hoạch tuần.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {workoutPlan.isLoading ? (
                <p className="text-sm text-muted-foreground">Đang tải lịch tập…</p>
              ) : workoutDay && !workoutDay.restDay ? (
                <ul className="space-y-2">
                  {workoutDay.activities.map((activity, index) => (
                    <li
                      key={`${activity.activity}-${index}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {activity.activityLabel}
                        {index === 0 && (
                          <span className="ml-1.5 rounded border border-primary/40 px-1 text-[10px] uppercase text-primary">
                            Chính
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-foreground">
                        {activity.durationMinutes} phút
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {noWorkoutPlan
                    ? 'Tuần này chưa có kế hoạch tập.'
                    : 'Hôm nay là ngày nghỉ hồi phục.'}{' '}
                  <Link href="/progress/workout" className="font-medium text-primary underline">
                    Xem kế hoạch
                  </Link>
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/progress/workout">Kế hoạch tập</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/progress/fasting">
                    {fasting.data ? 'Phiên nhịn ăn' : 'Bắt đầu nhịn ăn'}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <HeartPulse className="size-4 text-rose-600" aria-hidden="true" />
                Phục hồi & chỉ số
              </CardTitle>
              <CardDescription>Nước, giấc ngủ, cân nặng và streak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Thêm nước nhanh</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[250, 350, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => logWater.mutate({ amountMl: amount })}
                      disabled={logWater.isPending}
                    >
                      +{amount} ml
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-muted-foreground">
                  Giấc ngủ:{' '}
                  <span className="font-medium text-foreground">
                    {sleep.data ? formatDurationHours(sleep.data.durationHours) : 'Chưa ghi'}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Cân nặng:{' '}
                  <span className="font-medium text-foreground">
                    {dashboard.data?.currentWeightKg
                      ? `${dashboard.data.currentWeightKg} kg`
                      : 'Chưa có'}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Streak:{' '}
                  <span className="font-medium text-foreground">
                    {dashboard.data?.currentStreakDays ?? 0} ngày
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Nhịn ăn tuần này:{' '}
                  <span className="font-medium text-foreground">
                    {dashboard.data?.fastingThisWeekCompleted ?? 0} phiên
                  </span>
                </p>
              </div>
              {sleep.data && (
                <p className="text-xs text-muted-foreground">
                  Ngủ {formatDisplayDateTime(sleep.data.sleptAt)} →{' '}
                  {formatDisplayDateTime(sleep.data.wokeAt)}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/progress/sleep">Ghi giấc ngủ</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/progress/metrics">Cập nhật cân nặng</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/progress/water">Chi tiết nước</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-amber-600" aria-hidden="true" />
            Thói quen trường thọ
          </CardTitle>
          <CardDescription>Điểm và gợi ý cho 7 ngày gần nhất.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            Điểm:{' '}
            <span className="font-semibold text-foreground">
              {longevity.data ? Math.round(longevity.data.longevityScore) : '—'}/100
            </span>
          </p>
          {longevity.data?.actionableInsights.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {longevity.data.actionableInsights.slice(0, 3).map((insight) => (
                <li key={insight}>{insight}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chưa đủ dữ liệu để tính điểm. Ghi thêm bữa ăn, nước và giấc ngủ.
            </p>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/progress/longevity">Xem chi tiết</Link>
          </Button>
        </CardContent>
      </Card>

      <LogMealDialog open={mealOpen} onOpenChange={setMealOpen} />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  progress,
  tone = 'emerald',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  progress: number;
  tone?: 'emerald' | 'blue' | 'amber' | 'indigo';
}) {
  const toneClass = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-500',
  }[tone];

  return (
    <Card>
      <CardContent className="space-y-2 pt-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="text-lg font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div className={cn('h-full rounded-full', toneClass)} style={{ width: `${progress}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}
