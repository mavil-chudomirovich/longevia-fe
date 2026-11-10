'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { getBusinessTodayDateString, getBusinessWeekStart } from '@/lib/business-date';
import { CitationChipList } from '@/components/shared/citation-chip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { WeekPicker } from '@/components/shared/week-picker';
import { workoutActivityLabel } from '@/features/progress/mappers/progress-labels';
import { useProfileQuery } from '@/features/profile/queries/profile.queries';
import { describeAiFallback } from '@/lib/ai-fallback';
import {
  useGenerateWorkoutPlanMutation,
  useWorkoutPlanQuery,
} from '@/features/progress/queries/progress-ai.queries';

const JOINT_PAIN = 'joint_pain';

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

  const toggleLimitation = (value: string, checked: boolean) => {
    const next = checked
      ? [...new Set([...limitations, value])]
      : limitations.filter((item) => item !== value);
    setLimitationsEdit({ key: planKey, value: next });
  };

  const visibleWarnings = (plan?.warnings ?? []).filter(
    (warning) => warning.code !== 'no_limitations_assumed'
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Kế hoạch tập luyện theo tuần</h1>
          <p className="mt-1 text-muted-foreground">
            Lịch tập dựa trên hồ sơ, mục tiêu và giới hạn sức khỏe của bạn.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/progress">Về tổng quan</Link>
        </Button>
      </div>

      <Card className="mt-6">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div className="space-y-1 lg:col-span-2">
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
            <div className="space-y-1">
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
            <div className="space-y-1">
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
            <div className="space-y-1">
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
            <div className="space-y-1">
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
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="workout-equipment" className="text-sm font-medium">
                Dụng cụ sẵn có
              </label>
              <Input
                id="workout-equipment"
                value={equipmentText}
                onChange={(event) => setEquipmentEdit({ key: planKey, value: event.target.value })}
                placeholder="Ví dụ: tạ đơn, thảm yoga (cách nhau dấu phẩy)"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-2">
              <Button
                onClick={() => {
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
                }}
                disabled={generate.isPending}
              >
                {generate.isPending ? 'Đang tạo…' : 'Tạo kế hoạch'}
              </Button>
              <Button
                variant="outline"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                {query.isFetching ? 'Đang tải…' : 'Tải lại'}
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">Giới hạn sức khỏe</p>
            <label htmlFor="workout-joint-pain" className="flex items-start gap-2 text-sm">
              <Checkbox
                id="workout-joint-pain"
                checked={limitations.includes(JOINT_PAIN)}
                onCheckedChange={(checked) => toggleLimitation(JOINT_PAIN, checked === true)}
              />
              <span>
                Đau hoặc tổn thương khớp
                <span className="block text-xs text-muted-foreground">
                  Lịch tập sẽ tránh hoạt động tác động mạnh lên khớp.
                </span>
              </span>
            </label>
            {limitations.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Bạn chưa khai giới hạn sức khỏe. Có thể bật ở đây hoặc cập nhật trong Hồ sơ cá nhân
                để lần sau tự điền.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {generate.isPending || query.isLoading ? (
        <p className="py-8 text-muted-foreground">Đang lập lịch tập…</p>
      ) : error ? (
        <Card className="mt-6">
          <CardContent className="space-y-3 py-6">
            <p role="alert">{getApiErrorMessage(error, 'Chưa tạo được kế hoạch tập.')}</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : plan ? (
        <div className="mt-6 space-y-4">
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
          <div className="grid gap-4 md:grid-cols-2">
            {plan.days.map((day) => (
              <Card key={day.date}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {day.restDay
                      ? 'Ngày nghỉ'
                      : day.activityLabel || workoutActivityLabel(day.activity)}
                  </CardTitle>
                  <CardDescription>
                    {day.date}
                    {day.restDay
                      ? ' · nghỉ hồi phục'
                      : ` · ${day.durationMinutes} phút · ${day.intensity}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {!day.restDay && day.rationale && (
                    <MarkdownText
                      content={day.rationale}
                      compact
                      className="text-muted-foreground"
                    />
                  )}
                  {day.equipmentUsed.length > 0 && <p>Dụng cụ: {day.equipmentUsed.join(', ')}</p>}
                  <CitationChipList citations={day.citations} />
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{plan.disclaimer}</p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Tuần này chưa có kế hoạch. Chọn thông số rồi bấm “Tạo kế hoạch”.
        </p>
      )}
    </div>
  );
}
