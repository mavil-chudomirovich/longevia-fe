'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-error';
import { CitationChipList } from '@/components/shared/citation-chip';
import { MarkdownText } from '@/components/shared/markdown-text';
import { workoutActivityLabel } from '@/features/progress/mappers/progress-labels';
import {
  useGenerateWorkoutPlanMutation,
  useWorkoutPlanQuery,
} from '@/features/progress/queries/progress-ai.queries';

function nextMonday(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const delta = day === 1 ? 0 : (8 - day) % 7;
  now.setUTCDate(now.getUTCDate() + delta);
  return now.toISOString().slice(0, 10);
}

export default function WorkoutPage() {
  const [weekStart, setWeekStart] = React.useState(nextMonday);
  const [goal, setGoal] = React.useState('Longevity');
  const [days, setDays] = React.useState(7);
  const [sessions, setSessions] = React.useState(3);
  const [minutes, setMinutes] = React.useState(30);
  const [requested, setRequested] = React.useState(false);
  const query = useWorkoutPlanQuery(weekStart, requested);
  const generate = useGenerateWorkoutPlanMutation();
  const error = query.error ?? generate.error;
  const plan = query.data;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Kế hoạch tập luyện theo tuần</h1>
          <p className="mt-1 text-muted-foreground">
            Lịch tập dựa trên hồ sơ, mục tiêu và giới hạn của bạn.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/progress">Về tổng quan</Link>
        </Button>
      </div>
      <Card className="mt-6">
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
          <div className="space-y-1">
            <label htmlFor="workout-week" className="text-sm font-medium">
              Tuần
            </label>
            <Input
              id="workout-week"
              type="date"
              value={weekStart}
              onChange={(e) => {
                setWeekStart(e.target.value);
                setRequested(false);
              }}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="workout-goal" className="text-sm font-medium">
              Mục tiêu
            </label>
            <select
              id="workout-goal"
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            >
              <option value="LoseWeight">Giảm cân</option>
              <option value="Maintain">Duy trì</option>
              <option value="BuildMuscle">Tăng cơ</option>
              <option value="Longevity">Trường thọ</option>
            </select>
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
              onChange={(e) => setDays(Number(e.target.value))}
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
              onChange={(e) => setSessions(Number(e.target.value))}
            />
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
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </div>
          <Button
            onClick={() => {
              setRequested(true);
              void generate
                .mutateAsync({
                  weekStartDate: weekStart,
                  goal,
                  days,
                  sessionsPerWeek: sessions,
                  minutesPerSession: minutes,
                })
                .catch(() => undefined);
            }}
            disabled={generate.isPending}
          >
            {generate.isPending ? 'Đang tạo…' : 'Tạo kế hoạch'}
          </Button>
        </CardContent>
      </Card>

      {generate.isPending || (requested && query.isLoading) ? (
        <p className="py-8 text-muted-foreground">Đang lập lịch tập…</p>
      ) : error ? (
        <Card className="mt-6">
          <CardContent className="space-y-3 py-6">
            <p role="alert">{getApiErrorMessage(error, 'Chưa tạo được kế hoạch tập.')}</p>
            <Button variant="outline" onClick={() => setRequested(true)}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      ) : plan ? (
        <div className="mt-6 space-y-4">
          {plan.warnings.map((w) => (
            <p key={`${w.code}-${w.scope}`} className="rounded bg-amber-500/10 p-3 text-sm">
              {w.message}
            </p>
          ))}
          <div className="grid gap-4 md:grid-cols-2">
            {plan.days.map((day) => (
              <Card key={day.date}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {day.restDay ? 'Ngày nghỉ' : workoutActivityLabel(day.activity)}
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
        <p className="mt-6 text-sm text-muted-foreground">Chọn thông số rồi bấm “Tạo kế hoạch”.</p>
      )}
    </div>
  );
}
