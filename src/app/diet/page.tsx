'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LogMealDialog } from '@/features/diet/components/log-meal-dialog';
import { useDailySummaryQuery } from '@/features/diet/queries/diet.queries';

function Macro({
  label,
  data,
}: {
  label: string;
  data: { consumed: number; target: number; remaining: number };
}) {
  const percent =
    data.target > 0 ? Math.min(100, Math.max(0, (data.consumed / data.target) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>
          {data.consumed} / {data.target} g
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function DietPage() {
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const query = useDailySummaryQuery(date);
  const summary = query.data;
  const caloriePercent =
    summary && summary.targetCalories > 0
      ? Math.min(100, Math.max(0, (summary.consumedCalories / summary.targetCalories) * 100))
      : 0;
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Nhật ký dinh dưỡng</h1>
          <p className="mt-1 text-muted-foreground">Theo dõi những gì bạn ăn mỗi ngày.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialogOpen(true)}>Ghi bữa ăn</Button>
        </div>
      </div>
      <div className="mt-6 max-w-xs space-y-2">
        <label htmlFor="summary-date" className="text-sm font-medium">
          Ngày cần xem
        </label>
        <Input
          id="summary-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>
      {query.isLoading ? (
        <p className="py-10 text-muted-foreground">Đang tải nhật ký…</p>
      ) : query.isError ? (
        <Card className="mt-6">
          <CardContent className="space-y-3 py-6">
            <p role="alert">
              {query.error && 'Không thể tải nhật ký. Hãy kiểm tra mục tiêu dinh dưỡng và thử lại.'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void query.refetch()}>
                Thử lại
              </Button>
              <Button variant="outline" asChild>
                <Link href="/diet/targets">Thiết lập mục tiêu</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        summary && (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>Tổng quan ngày {summary.date}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Đã dùng / mục tiêu</span>
                    <strong className="text-2xl">
                      {summary.consumedCalories} / {summary.targetCalories} kcal
                    </strong>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${caloriePercent}%` }} />
                  </div>
                  <p className="mt-2 text-sm">
                    Còn lại: <strong>{summary.remainingCalories} kcal</strong>
                  </p>
                </div>
                <div className="space-y-4">
                  <Macro label="Protein" data={summary.macros.protein} />
                  <Macro label="Carbohydrate" data={summary.macros.carbs} />
                  <Macro label="Chất béo" data={summary.macros.fat} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bữa ăn</CardTitle>
              </CardHeader>
              <CardContent>
                {summary.meals.length ? (
                  <ul className="divide-y">
                    {summary.meals.map((meal) => (
                      <li key={meal.mealType} className="flex justify-between py-3 text-sm">
                        <span>
                          {meal.mealType} · {meal.itemsCount} món
                        </span>
                        <strong>{meal.totalCalories} kcal</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">
                    Chưa có bữa ăn nào trong ngày này.
                  </p>
                )}
                <Button className="mt-3" onClick={() => setDialogOpen(true)}>
                  Ghi bữa ăn
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      )}
      <LogMealDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
