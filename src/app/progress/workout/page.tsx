'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import {
  formatBusinessWeekRange,
  getBusinessTodayDateString,
  getBusinessWeekStart,
} from '@/lib/business-date';
import { CitationChipList } from '@/components/shared/citation-chip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { WeekPicker } from '@/components/shared/week-picker';
import { HealthLimitationsPicker } from '@/components/shared/health-limitations-picker';
import { workoutActivityLabel } from '@/features/progress/mappers/progress-labels';
import { useProfileQuery } from '@/features/profile/queries/profile.queries';
import { describeAiFallback } from '@/lib/ai-fallback';
import { cn } from '@/lib/utils';
import {
  useGenerateWorkoutPlanMutation,
  useWorkoutPlanQuery,
} from '@/features/progress/queries/progress-ai.queries';

function formatDayTitle(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(parsed);
  const short = `${String(parsed.getDate()).padStart(2, '0')}/${String(
    parsed.getMonth() + 1
  ).padStart(2, '0')}`;
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${short}`;
}

export default function WorkoutPage() {
  const [weekStart, setWeekStart] = React.useState(() =>
    getBusinessWeekStart(getBusinessTodayDateString())
  );
  const [goal, setGoal] = React.useState('Longevity');
  const [daysEdit, setDaysEdit] = React.useState<{ key: string; value: number } | null>(null);
  const [sessionsEdit, setSessionsEdit] = React.useState<{ key: string; value: number } | null>(
    null
  );
  const [minutesEdit, setMinutesEdit] = React.useState<{ key: string; value: number } | null>(null);
  const [limitationsEdit, setLimitationsEdit] = React.useState<{
    key: string;
    value: string[];
  } | null>(null);
  const [equipmentEdit, setEquipmentEdit] = React.useState<{ key: string; value: string } | null>(
    null
  );
  const [showAdvanced, setShowAdvanced] = React.useState(true);
  const profile = useProfileQuery();
  const query = useWorkoutPlanQuery(weekStart, true);
  const generate = useGenerateWorkoutPlanMutation();

  const plan = query.data;
  const planKey = plan?.id ?? weekStart;
  const notFound = getApiErrorCode(query.error) === 'progress.workout_plan_not_found';
  const error = plan ? null : notFound ? null : (query.error ?? generate.error);
  const fallbackInfo = plan?.usedFallback ? describeAiFallback(plan.usedFallbackReason) : null;

  const days = daysEdit?.key === planKey ? daysEdit.value : plan?.daysRequested || 7;
  const sessions =
    sessionsEdit?.key === planKey ? sessionsEdit.value : plan?.sessionsScheduled || 3;
  const minutes = minutesEdit?.key === planKey ? minutesEdit.value : plan?.minutesPerSession || 30;

  const profileLimitations = profile.data?.profile?.healthLimitations ?? [];
  const defaultLimitations =
    plan && plan.limitations.length > 0 ? plan.limitations : profileLimitations;
  const limitations = limitationsEdit?.key === planKey ? limitationsEdit.value : defaultLimitations;
  const equipmentText =
    equipmentEdit?.key === planKey
      ? equipmentEdit.value
      : (plan?.equipmentAvailable.join(', ') ?? '');

  const equipmentAvailable = React.useMemo(
    () =>
      equipmentText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [equipmentText]
  );

  const visibleWarnings = (plan?.warnings ?? []).filter(
    (warning) => warning.code !== 'no_limitations_assumed'
  );

  const onCreate = () => {
    void generate
      .mutateAsync({
        weekStartDate: weekStart,
        goal,
        days,
        sessionsPerWeek: sessions,
        minutesPerSession: minutes,
        limitations,
        equipmentAvailable,
      })
      .catch(() => undefined);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Kế hoạch tập luyện theo tuần</h1>
          <p className="mt-1 text-muted-foreground">
            Thiết lập ở cột bên trái — lịch tập hiển thị ngay bên cạnh.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/progress">Về tổng quan</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <Card className="lg:sticky lg:top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thiết lập buổi tập</CardTitle>
            <CardDescription className="text-xs">
              {formatBusinessWeekRange(weekStart)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="workout-week" className="text-sm font-medium">
                Tuần
              </label>
              <WeekPicker
                id="workout-week"
                value={weekStart}
                onChange={setWeekStart}
                disabled={generate.isPending}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="workout-goal" className="text-sm font-medium">
                Mục tiêu
              </label>
              <select
                id="workout-goal"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
              >
                <option value="LoseWeight">Giảm cân</option>
                <option value="Maintain">Duy trì</option>
                <option value="BuildMuscle">Tăng cơ</option>
                <option value="Longevity">Trường thọ</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="workout-days" className="text-sm font-medium">
                  Số ngày
                </label>
                <Input
                  id="workout-days"
                  type="number"
                  min={1}
                  max={7}
                  value={days}
                  onChange={(event) =>
                    setDaysEdit({ key: planKey, value: Number(event.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="workout-sessions" className="text-sm font-medium">
                  Buổi/tuần
                </label>
                <Input
                  id="workout-sessions"
                  type="number"
                  min={1}
                  max={7}
                  value={sessions}
                  onChange={(event) =>
                    setSessionsEdit({ key: planKey, value: Number(event.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="workout-minutes" className="text-sm font-medium">
                Phút/buổi
              </label>
              <Input
                id="workout-minutes"
                type="number"
                min={10}
                max={120}
                value={minutes}
                onChange={(event) =>
                  setMinutesEdit({ key: planKey, value: Number(event.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="workout-equipment" className="text-sm font-medium">
                Dụng cụ sẵn có
              </label>
              <Input
                id="workout-equipment"
                value={equipmentText}
                onChange={(event) => setEquipmentEdit({ key: planKey, value: event.target.value })}
                placeholder="Ví dụ: tạ đơn, thảm yoga"
              />
            </div>

            <div className="space-y-2 border-t pt-3">
              <button
                type="button"
                className="flex w-full items-center justify-between text-sm font-medium"
                onClick={() => setShowAdvanced((value) => !value)}
                aria-expanded={showAdvanced}
              >
                <span>
                  Giới hạn sức khỏe
                  {limitations.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                      {limitations.length}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={cn('size-4 transition-transform', showAdvanced && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
              {showAdvanced && (
                <HealthLimitationsPicker
                  value={limitations}
                  onChange={(next) => setLimitationsEdit({ key: planKey, value: next })}
                  disabled={generate.isPending}
                />
              )}
            </div>

            <div className="space-y-2 border-t pt-3">
              <Button className="w-full" onClick={onCreate} disabled={generate.isPending}>
                {generate.isPending ? 'Đang tạo…' : 'Tạo kế hoạch'}
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
                  ? `${plan.sessionsScheduled} buổi · ${plan.minutesPerSession} phút/buổi`
                  : 'Chưa có kế hoạch cho tuần này'}
              </p>
            </div>
            {plan?.generatedAt && (
              <p className="text-xs text-muted-foreground">
                Tạo lúc {plan.generatedAt.toLocaleString('vi-VN')}
              </p>
            )}
          </div>

          {generate.isPending || query.isLoading ? (
            <p className="py-8 text-muted-foreground">Đang lập lịch tập…</p>
          ) : error ? (
            <Card>
              <CardContent className="space-y-3 py-6">
                <p role="alert">{getApiErrorMessage(error, 'Chưa tạo được kế hoạch tập.')}</p>
                <Button variant="outline" onClick={() => void query.refetch()}>
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          ) : plan ? (
            <>
              {plan.usedFallback && fallbackInfo && (
                <div className="space-y-2 rounded border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-sm">{fallbackInfo.message}</p>
                  {fallbackInfo.retryable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void query.refetch()}
                      disabled={generate.isPending}
                    >
                      Thử tạo lại
                    </Button>
                  )}
                </div>
              )}
              {visibleWarnings.map((warning) => (
                <p
                  key={`${warning.code}-${warning.scope}`}
                  className="rounded bg-amber-500/10 p-3 text-sm"
                >
                  {warning.message}
                </p>
              ))}
              <div className="grid gap-4 xl:grid-cols-2">
                {plan.days.map((day) => (
                  <Card key={day.date}>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-foreground">
                        {formatDayTitle(day.date)}
                      </CardTitle>
                      <CardDescription>
                        {day.restDay ? 'Nghỉ hồi phục' : `Buổi tập · ${day.durationMinutes} phút`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {!day.restDay && day.activities.length > 0 && (
                        <ul className="space-y-1.5">
                          {day.activities.map((activity, index) => (
                            <li
                              key={`${activity.activity}-${index}`}
                              className="flex items-start justify-between gap-3 rounded bg-muted/40 px-2.5 py-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  {index === 0 && (
                                    <span className="rounded border border-primary/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                                      Chính
                                    </span>
                                  )}
                                  <span className="font-semibold text-foreground">
                                    {activity.activityLabel ||
                                      workoutActivityLabel(activity.activity)}
                                  </span>
                                </div>
                                {activity.intensity && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    Cường độ: {activity.intensity}
                                  </p>
                                )}
                              </div>
                              <span className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                                {activity.durationMinutes} phút
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {!day.restDay && day.rationale && (
                        <MarkdownText
                          content={day.rationale}
                          compact
                          className="text-muted-foreground"
                        />
                      )}
                      {day.equipmentUsed.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Dụng cụ: {day.equipmentUsed.join(', ')}
                        </p>
                      )}
                      <CitationChipList citations={day.citations} />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{plan.disclaimer}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tuần này chưa có kế hoạch. Chọn thông số ở cột bên trái rồi bấm “Tạo kế hoạch”.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
